import { Request, Response } from "express";
import {  InvoiceStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import  {buildSupplierRelation}  from "./purchaseOrderController";

//const prisma = new PrismaClient();

/** Frontend-friendly mapper: flatten supplier, coerce Decimals/Dates, map line fields */
function toInvoiceDTO(inv: any) {
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    supplierId: inv.supplierId,
    supplier: inv.supplier?.name ?? undefined, // FE expects string
    poId: inv.poId ?? undefined,
    poNumber: inv.poId ?? undefined,
    status: inv.status as InvoiceStatus,       // "PENDING" | "PAID" | "OVERDUE"
    date: inv.date instanceof Date ? inv.date.toISOString() : inv.date,
    dueDate: inv.dueDate
      ? inv.dueDate instanceof Date
        ? inv.dueDate.toISOString()
        : inv.dueDate
      : undefined,
    lines: (inv.items ?? []).map((it: any) => ({
      draftProductId: it.draftProductId,
      productId: it.productId || null,
      poItemId: it.poItemId || undefined,
      invoiceItemId: it.id,
      sku: undefined,                          // optional on FE
      name: it.draftProduct?.name ?? it.name,   // FE uses "name"
      unit: it.uom ?? it.unit ?? "",           // schema uses "uom"; tolerate "unit"
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
      lineTotal: Number(it.lineTotal),
    })),
    amount: Number(inv.amount),
    balanceRemaining:
      inv.balanceRemaining == null ? null : Number(inv.balanceRemaining),  };
}

export const listInvoices = async (req: Request, res: Response) => {
  try {
    const { status, q } = req.query as Partial<{ status: string; q: string }>;
    const where: any = {};

    // Validate/normalize status
    if (status && ["PENDING", "PAID", "OVERDUE"].includes(status)) {
      where.status = status as InvoiceStatus;
    }

    if (q && q.trim()) {
      where.OR = [
        { invoiceNumber: { contains: q, mode: "insensitive" } },
        { supplier: { is: { name: { contains: q, mode: "insensitive" } } } },
      ];
    }

    const rows = await prisma.supplierInvoice.findMany({
      where,
      include: { 
        supplier: true, 
        items: {
          include: {
            draftProduct: true, 
            product: true,
          }
        }
        , 
        po: true },
      orderBy: { date: "desc" },
    });

    return res.json(rows.map(toInvoiceDTO));
  } catch (error) {
    console.error("listInvoices error:", error);
    res.status(500).json({ message: "Error retrieving supplier invoices." });
  }
};


export const getInvoice = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    console.log("Fetching invoice with ID:", id); // Debug

    const invoice = await prisma.supplierInvoice.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            draftProduct: true,
            product: true,
          },
        },
        po: true,
        goodsReceipt: true,
      }
    });

    console.log("Found invoice:", invoice); // Move here ✅

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found." });
    }

    const dto = toInvoiceDTO(invoice);
    console.log("Sending DTO:", dto); // Check the transformation
    return res.json(dto);
  } catch (error) {
    console.error("getInvoice error:", error);
    return res.status(500).json({ message: "Error retrieving invoice." });
  }
};

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const { invoiceNumber, supplierId, poId, date, dueDate, lines = [] } = req.body;

    if (!invoiceNumber || !supplierId || !poId || !Array.isArray(lines) || lines.length === 0) {
      return res
        .status(400)
        .json({ message: "invoiceNumber, supplierId, poId and non-empty lines are required." });
    }

    // Basic line validation (numbers + required ids)
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const qty = Number(l.quantity);
      const unitPrice = Number(l.unitPrice);

      if (!l.draftProductId || typeof l.draftProductId !== "string" || !l.draftProductId.trim()) {
        return res.status(400).json({ message: `Line ${i + 1}: draftProductId is required.` });
      }

      // If you want PO-driven invoicing (recommended): require poItemId for each line
      if (!l.poItemId || typeof l.poItemId !== "string" || !l.poItemId.trim()) {
        return res.status(400).json({
          message: `Line ${i + 1}: poItemId is required when creating an invoice from a purchase order.`,
        });
      }

      if (!Number.isFinite(qty) || qty <= 0) {
        return res.status(400).json({ message: `Line ${i + 1}: quantity must be > 0.` });
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return res.status(400).json({ message: `Line ${i + 1}: unitPrice must be >= 0.` });
      }
    }

    // Normalize + de-dupe IDs for validation (IMPORTANT: avoid duplicates causing false mismatch)
    const draftIds = Array.from(
      new Set(
        lines
          .map((l: any) => (typeof l.draftProductId === "string" ? l.draftProductId.trim() : ""))
          .filter(Boolean)
      )
    );

    const poItemIds = Array.from(
      new Set(
        lines
          .map((l: any) => (typeof l.poItemId === "string" ? l.poItemId.trim() : ""))
          .filter(Boolean)
      )
    );

    // Transaction to prevent race conditions (two invoices at once)
    const created = await prisma.$transaction(
      async (tx) => {
        // Load PO + items (needed for remaining calculations)
        const po = await tx.purchaseOrder.findUnique({
          where: { id: poId },
          select: {
            id: true,
            supplierId: true,
            items: {
              select: {
                id: true,
                productId: true, // DraftProduct id on PO item
                quantity: true,
              },
            },
          },
        });

        if (!po) {
          const err: any = new Error("Purchase order not found.");
          err.status = 404;
          throw err;
        }

        if (po.supplierId !== supplierId) {
          const err: any = new Error("Invoice supplier does not match purchase order supplier.");
          err.status = 400;
          throw err;
        }

        // Validate poItemIds belong to this PO
        const poItemMap = new Map(po.items.map((it) => [it.id, it]));
        for (const id of poItemIds) {
          if (!poItemMap.has(id)) {
            const err: any = new Error(`Invalid poItemId: ${id} (not found on this PO).`);
            err.status = 400;
            throw err;
          }
        }

        // Validate draft products exist
        const draftCount = await tx.draftProduct.count({
          where: { id: { in: draftIds } },
        });
        if (draftCount !== draftIds.length) {
          const err: any = new Error("One or more draftProductIds not found.");
          err.status = 400;
          throw err;
        }

        // Ensure each line draftProductId matches the PO item productId (prevents mismatched selection)
        for (let i = 0; i < lines.length; i++) {
          const l = lines[i];
          const poItem = poItemMap.get(String(l.poItemId).trim());
          if (!poItem) continue;

          const draftId = String(l.draftProductId).trim();
          if (poItem.productId !== draftId) {
            const err: any = new Error(
              `Line ${i + 1}: draftProductId does not match the PO item productId.`
            );
            err.status = 400;
            throw err;
          }
        }

        // Compute already-invoiced quantities per poItemId for this PO
        // (only count invoice items that have poItemId set; that’s your truth source)
        const invoicedAgg = await tx.supplierInvoiceItem.groupBy({
          by: ["poItemId"],
          where: {
            poItemId: { in: poItemIds },
            invoice: {
              poId: poId,
              // If you later add CANCELLED/VOID status, exclude them here.
              // status: { notIn: ["CANCELLED", "VOID"] }
            },
          },
          _sum: { quantity: true },
        });

        const alreadyInvoicedByPoItem = new Map<string, number>();
        for (const row of invoicedAgg) {
          const key = row.poItemId ?? "";
          if (!key) continue;
          alreadyInvoicedByPoItem.set(key, Number(row._sum.quantity ?? 0));
        }

        // Validate each new line does not exceed remaining quantity
        for (let i = 0; i < lines.length; i++) {
          const l = lines[i];
          const poItemId = String(l.poItemId).trim();
          const requestedQty = Number(l.quantity);

          const poItem = poItemMap.get(poItemId);
          if (!poItem) continue;

          const already = alreadyInvoicedByPoItem.get(poItemId) ?? 0;
          const remaining = Number(poItem.quantity) - already;

          if (requestedQty > remaining) {
            const err: any = new Error(
              `Line ${i + 1}: quantity (${requestedQty}) exceeds remaining to invoice (${remaining}) for PO item ${poItemId}.`
            );
            err.status = 400;
            throw err;
          }
        }

        // Compute amount
        const amount = lines.reduce((s: number, l: any) => {
          const q = Number(l.quantity) || 0;
          const p = Number(l.unitPrice) || 0;
          return s + q * p;
        }, 0);

        // Create invoice + items
        const createdInvoice = await tx.supplierInvoice.create({
          data: {
            invoiceNumber: String(invoiceNumber).trim(),
            supplierId: String(supplierId).trim(),
            poId: String(poId).trim(),
            date: date ? new Date(date) : new Date(),
            dueDate: dueDate ? new Date(dueDate) : null,
            status: "PENDING",
            amount,

            items: {
              create: lines.map((line: any) => ({
                poItem: line.poItemId
                  ? { connect: { id: String(line.poItemId).trim() } }
                  : undefined,

                draftProduct: {
                  connect: { id: String(line.draftProductId).trim() },
                },

                description: line.description ?? line.name ?? "",
                uom: line.unit ?? line.uom ?? "",
                quantity: Number(line.quantity),
                unitPrice: Number(line.unitPrice),
                lineTotal: Number(line.quantity) * Number(line.unitPrice),
              })),
            },
          },
          include: {
            supplier: true,
            po: true,
            items: {
              include: {
                draftProduct: true,
                product: true,
                poItem: true,
              },
            },
            goodsReceipt: true,
          },
        });

        return createdInvoice;
      },
      // If you're on Postgres, Serializable is ideal for this "remaining qty" concurrency problem.
      // If Prisma/DB complains, remove the isolationLevel option.
      { isolationLevel: "Serializable" as any }
    );

    return res.status(201).json(toInvoiceDTO(created));
  } catch (error: any) {
    console.error("createInvoice error:", error);

    const status = Number(error?.status) || undefined;
    if (status) {
      return res.status(status).json({ message: error.message });
    }

    if (error?.code === "P2002") {
      return res
        .status(409)
        .json({ message: "Duplicate invoice (unique constraint).", meta: error.meta });
    }
    if (error?.code === "P2003") {
      return res.status(400).json({ message: "Invalid reference (FK).", meta: error.meta });
    }
    if (error?.code === "P2025") {
      return res.status(404).json({ message: "Related record not found.", meta: error.meta });
    }

    return res.status(500).json({
      message: "Error creating supplier invoice.",
      debug: error?.message,
    });
  }
};


export const markInvoicePaid = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // If you want to accept a status or paidDate from FE, read them here:
    // const { status, paidDate } = req.body;
    const updated = await prisma.supplierInvoice.update({
      where: { id },
      data: { status: "PAID" },
      include: { 
        supplier: true, 
        items: { include: { draftProduct: true, product: true }}, 
        po: true },
    });
    return res.json(toInvoiceDTO(updated));
  } catch (error) {
    console.error("markInvoicePaid error:", error);
    res.status(500).json({ message: "Error updating invoice." });
  }
};

export const updateInvoice = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const { 
    invoiceNumber, 
    poId, 
    supplierId, 
    supplier, 
    status, 
    date, 
    dueDate, 
    items = [],
    amount 
  } = req.body;

  try {
    // Validate invoice ID
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Invalid invoice ID" });
    }

    // Validate items array
    const items = Array.isArray(req.body.items)
  ? req.body.items
  : Array.isArray(req.body.lines)
  ? req.body.lines
  : [];

      
      if (!items || items.length === 0 ) {
        return res
          .status(400)
          .json({ error: "Line items are required" });
      }

    // Check if invoice exists
    const existingInvoice = await prisma.supplierInvoice.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Helper function to convert date strings to ISO DateTime
    const toISODateTime = (dateString: string) => {
      if (!dateString) return null;
      const trimmedDate = dateString.trim();
      if (!trimmedDate) return null;
      if (trimmedDate.includes("T")) return trimmedDate;
      return `${trimmedDate}T00:00:00Z`;
    };

    // Build the update data object
    const data: any = {};

    // Update basic fields
    if (invoiceNumber !== undefined) data.invoiceNumber = String(invoiceNumber).trim();
    if (poId !== undefined) {
  const cleaned = poId ? String(poId).trim() : "";
  data.po = cleaned ? { connect: { id: cleaned } } : { disconnect: true };
}


    if (status !== undefined) data.status = status;
    if (amount !== undefined) data.amount = amount;

    // Update dates
    if (date !== undefined) {
      const invoiceDate = toISODateTime(date);
      if (invoiceDate) data.date = invoiceDate;
    }

    if (dueDate !== undefined) {
      const invoiceDueDate = toISODateTime(dueDate);
      data.dueDate = invoiceDueDate;
    }

    // Update supplier relationship
    if (supplierId !== undefined || supplier !== undefined) {
      Object.assign(data, buildSupplierRelation({ supplier, supplierId }));
    }

    // Update invoice items if provided
    if (items.length > 0) {
      // Delete existing items
      await prisma.supplierInvoiceItem.deleteMany({
        where: { invoiceId: id }
      });

      // Create new items
      data.items = {
        create: items.map((item: any) => {
          // Validate required fields
          if (!item.draftProductId) {
            throw new Error("Each item must have a draftProductId");
          }

          if (!item.quantity || item.quantity <= 0) {
            throw new Error("Each item must have a valid quantity");
          }

          const quantity = Number(item.quantity);
          const unitPrice = Number(item.unitPrice || 0);
          const lineTotal = quantity * unitPrice;

          return {
            draftProductId: String(item.draftProductId).trim(),
            productId: item.productId ? String(item.productId).trim() : null,
            description: item.description || item.name || null,
            uom: item.uom || item.unit || null,
            quantity,
            unitPrice,
            lineTotal
          };
        })
      };
    }

    // Perform the update
    const updatedInvoice = await prisma.supplierInvoice.update({
      where: { id },
      data,
      include: {
        supplier: true,
        po: true,
        items: {
          include: {
            draftProduct: true,
            product: true
          }
        }
      }
    });
    console.log("Updated invoice:", updatedInvoice);

    // Return success response
    return res.status(200).json({
      message: "Invoice updated successfully",
      invoice: updatedInvoice
    });

  } catch (error: any) {
    console.error("Error updating invoice:", error);
    
    // Handle specific Prisma errors
    if (error.code === "P2002") {
      return res.status(409).json({ 
        message: "Invoice number already exists for this supplier" 
      });
    }

    if (error.code === "P2003") {
      return res.status(400).json({ 
        message: "Invalid reference: supplier, PO, or product not found" 
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({ 
        message: "Invoice not found" 
      });
    }

    // Generic error response
    return res.status(500).json({ 
      message: error.message || "Failed to update invoice" 
    });
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  const invoiceId = req.params.id;

  if (!invoiceId) {
    return res.status(400).json({ message: "Invoice ID is required" });
  }

  try {
    // ✅ Guard: don’t delete if GRN exists
    const existing = await prisma.supplierInvoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, goodsReceipt: { select: { id: true } } }, // use your real field name
    });

    if (!existing) return res.status(404).json({ message: "Invoice not found." });

    if (existing.goodsReceipt) {
      return res.status(400).json({ message: "Cannot delete invoice with a GRN attached." });
    }

    const result = await prisma.$transaction(async (tx) => {
      const items = await tx.supplierInvoiceItem.findMany({
        where: { invoiceId },
        select: { draftProductId: true },
      });

      const productIds = [...new Set(items.map((i) => i.draftProductId))];

      await tx.supplierInvoice.delete({ where: { id: invoiceId } });

      const orphanedProducts = await tx.draftProduct.findMany({
        where: {
          id: { in: productIds },
          invoiceItems: { none: {} },
          poItems: { none: {} },
          grnItems: { none: {} }, // must match your schema field name exactly
        },
        select: { id: true },
      });

      const orphanIds = orphanedProducts.map((p) => p.id);

      const deletedProducts = orphanIds.length
        ? await tx.draftProduct.deleteMany({ where: { id: { in: orphanIds } } })
        : { count: 0 };

      return {
        invoiceId,
        deletedItemsCount: items.length,
        deletedProductCount: deletedProducts.count,
      };
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Deletion transaction failed:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ message: "Invoice not found." });
    }

    return res.status(500).json({
      message: "Failed to delete the Invoice and associated products.",
      error: error.message,
    });
  }
};

export const updateInvoiceStatus = async (req:Request, res:Response) => {
  const { id } = req.params
  const { status } = req.body
  
  try {
    if (!id) return res.status(404).json({ message: "Invoice ID not found"})

    const updatedStatus = await prisma.supplierInvoice.update({
      where: { id },
      data: {
        status: status
      }
    })
    
    return res.status(200).json(updatedStatus)
  } catch (error: any) {
    console.error("updatedInvoiceStatusError:", error)
    return res.status(500).json({error: "Failed to updated invoice status"})
  }
}

// export const updateInvoice = async (req: Request, res: Response) => {
//   const { id } = req.params;
  
//   const { 
//     invoiceNumber, 
//     poId, 
//     supplierId, 
//     supplier, 
//     status, 
//     date, 
//     dueDate, 
//     items = [],
//     amount 
//   } = req.body;

//   try {
//     // Validate invoice ID
//     if (!id || typeof id !== "string") {
//       return res.status(400).json({ message: "Invalid invoice ID" });
//     }

//     // Validate items array
//     const items = Array.isArray(req.body.items)
//   ? req.body.items
//   : Array.isArray(req.body.lines)
//   ? req.body.lines
//   : [];

      
//       if (!items || items.length === 0 ) {
//         return res
//           .status(400)
//           .json({ error: "Line items are required" });
//       }

//     // Check if invoice exists
//     const existingInvoice = await prisma.supplierInvoice.findUnique({
//       where: { id },
//       include: { items: true }
//     });

//     if (!existingInvoice) {
//       return res.status(404).json({ message: "Invoice not found" });
//     }

//     // Helper function to convert date strings to ISO DateTime
//     const toISODateTime = (dateString: string) => {
//       if (!dateString) return null;
//       const trimmedDate = dateString.trim();
//       if (!trimmedDate) return null;
//       if (trimmedDate.includes("T")) return trimmedDate;
//       return `${trimmedDate}T00:00:00Z`;
//     };

//     // Build the update data object
//     const data: any = {};

//     // Update basic fields
//     if (invoiceNumber !== undefined) data.invoiceNumber = String(invoiceNumber).trim();
//     if (poId !== undefined) {
//   const cleaned = poId ? String(poId).trim() : "";
//   data.po = cleaned ? { connect: { id: cleaned } } : { disconnect: true };
// }


//     if (status !== undefined) data.status = status;
//     if (amount !== undefined) data.amount = amount;

//     // Update dates
//     if (date !== undefined) {
//       const invoiceDate = toISODateTime(date);
//       if (invoiceDate) data.date = invoiceDate;
//     }

//     if (dueDate !== undefined) {
//       const invoiceDueDate = toISODateTime(dueDate);
//       data.dueDate = invoiceDueDate;
//     }

//     // Update supplier relationship
//     if (supplierId !== undefined || supplier !== undefined) {
//       Object.assign(data, buildSupplierRelation({ supplier, supplierId }));
//     }

//     // Update invoice items if provided
//     if (items.length > 0) {
//       // Delete existing items
//       await prisma.supplierInvoiceItem.deleteMany({
//         where: { invoiceId: id }
//       });

//       // Create new items
//       data.items = {
//         create: items.map((item: any) => {
//           // Validate required fields
//           if (!item.draftProductId) {
//             throw new Error("Each item must have a draftProductId");
//           }

//           if (!item.quantity || item.quantity <= 0) {
//             throw new Error("Each item must have a valid quantity");
//           }

//           const quantity = Number(item.quantity);
//           const unitPrice = Number(item.unitPrice || 0);
//           const lineTotal = quantity * unitPrice;

//           return {
//             draftProductId: String(item.draftProductId).trim(),
//             productId: item.productId ? String(item.productId).trim() : null,
//             description: item.description || item.name || null,
//             uom: item.uom || item.unit || null,
//             quantity,
//             unitPrice,
//             lineTotal
//           };
//         })
//       };
//     }

//     // Perform the update
//     const updatedInvoice = await prisma.supplierInvoice.update({
//       where: { id },
//       data,
//       include: {
//         supplier: true,
//         po: true,
//         items: {
//           include: {
//             draftProduct: true,
//             product: true
//           }
//         }
//       }
//     });
//     console.log("Updated invoice:", updatedInvoice);

//     // Return success response
//     return res.status(200).json({
//       message: "Invoice updated successfully",
//       invoice: updatedInvoice
//     });

//   } catch (error: any) {
//     console.error("Error updating invoice:", error);
    
//     // Handle specific Prisma errors
//     if (error.code === "P2002") {
//       return res.status(409).json({ 
//         message: "Invoice number already exists for this supplier" 
//       });
//     }

//     if (error.code === "P2003") {
//       return res.status(400).json({ 
//         message: "Invalid reference: supplier, PO, or product not found" 
//       });
//     }

//     if (error.code === "P2025") {
//       return res.status(404).json({ 
//         message: "Invoice not found" 
//       });
//     }

//     // Generic error response
//     return res.status(500).json({ 
//       message: error.message || "Failed to update invoice" 
//     });
//   }
// };