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
      sku: undefined,                          // optional on FE
      name: it.draftProduct?.name ?? it.name,   // FE uses "name"
      unit: it.uom ?? it.unit ?? "",           // schema uses "uom"; tolerate "unit"
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
      lineTotal: Number(it.lineTotal),
    })),
    amount: Number(inv.amount),
  };
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
        GoodsReceipt: true,
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

    if (!invoiceNumber || !supplierId || !Array.isArray(lines) || lines.length === 0) {
      return res
        .status(400)
        .json({ error: "invoiceNumber, supplierId and non-empty line items are required" });
    }

    const amount = lines.reduce(
      (s: number, l: any) => s + Number(l.quantity) * Number(l.unitPrice),
      0
    );

    console.log("REQ BODY:", req.body);
    console.log("LINES TYPE:", Array.isArray(lines), lines);

    const created = await prisma.supplierInvoice.create({
      data: {
        invoiceNumber,
        supplierId,
        poId: poId ?? null,
        date: date ? new Date(date) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        status: "PENDING",
        amount,
        items: {
          create: lines.map((line: any) => ({
            //productId: line.productId || null,
            draftProduct: {
              connect: { id: line.draftProductId },
            },
            description: line.description ?? line.name ?? "",
            // schema field is "uom"
            uom: line.unit ?? line.uom ?? "",
            quantity: Number(line.quantity),
            unitPrice: Number(line.unitPrice),
            lineTotal: Number(line.quantity) * Number(line.unitPrice),
          })),
        },
      },
      include: { 
        supplier: true, 
        items: { include: { 
          draftProduct: true,
          product: true,
        } }, 
        po: true },

        //orderBy: { date: "desc" }
    }
    
  );

    console.log("REQ BODY:", req.body);
    console.log("LINES TYPE:", Array.isArray(lines), lines);


    return res.status(201).json(toInvoiceDTO(created));
  } catch (error) {
    console.error("createInvoice error:", error);
    res.status(500).json({ message: "Error creating supplier invoice." });
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
      include: { supplier: true, items: true, po: true },
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
  const invoiceId = req.params.id 

  if (!invoiceId) {
    return res.status(400).json({ message: "Invoice ID is required" });
  }

  try {
    const result =  await prisma.$transaction(async (tx) => {
      const items = await tx.supplierInvoiceItem.findMany({
        where: { invoiceId: invoiceId},
        select: { draftProductId: true },
      })

      const productIds = items.map((item) => item.draftProductId)

      //delete the invoice 
      const deletedInvoice = await tx.supplierInvoice.delete({
        where: { id: invoiceId },
      })

      const orphanedProducts = await tx.draftProduct.findMany({
        where: {
          id: { in: productIds },
          supplierItems: {
            none: { },
          },
          poItems: {
            none: { },
          },
          goodsReciept : {
            none: {},
          },
        },
        select: { id: true },
      })

      const orphanProductId = orphanedProducts.map((product) => product.id)

      let deletedProductCount = 0;

    if (orphanedProducts.length > 0) {
      const deletedPorducts = await tx.draftProduct.deleteMany({
        where: {
          id: { in: orphanProductId },
        },
      })
      deletedProductCount = deletedPorducts.count
    }
    })
    return res.status(200).json(result)
    }
   catch (error: any) {
    console.error("Deletion transaction failed:", error);
    
    // Check if Inovice doesn't exist
    if (error.code === "P2025") {
      return res.status(404).json({
        message: "Invoice not found.",
      });
    }

    return res.status(500).json({
      message: "Failed to delete the Invoice and associated products.",
      error: error.message,
    });
  }
}


