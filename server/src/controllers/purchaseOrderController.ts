import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { POStatus } from "@prisma/client";
import it from "zod/v4/locales/it.js";
import { create } from "domain";
import { PhoneNumber } from "@clerk/backend";
import { debug } from "console";

//const prisma = new PrismaClient();

/** Frontend-friendly mapper: flattens supplier, coerces Decimals/Dates 
 ** This decides what JSON fields your API actually sends to the frontend.
 **Cleans up the prisma messy response into a format compactible with the frontend.
*/
function toPurchaseOrderDTO(po: any) {
  // ----------------------------
  // 1) Build map: poItemId -> total invoiced qty
  // ----------------------------
  const invoicedQtyByPoItemId = new Map<string, number>();

  for (const inv of po.invoices ?? []) {
    for (const invItem of inv.items ?? []) {
      const poItemId = invItem.poItemId;
      if (!poItemId) continue;

      const prev = invoicedQtyByPoItemId.get(poItemId) ?? 0;
      invoicedQtyByPoItemId.set(poItemId, prev + Number(invItem.quantity ?? 0));
    }
  }

  // ----------------------------
  // 2) Map PO items with remainingToInvoice
  // ----------------------------
  const items = (po.items ?? []).map((it: any) => {
    const orderedQty = Number(it.quantity ?? 0);
    const invoicedQty = invoicedQtyByPoItemId.get(it.id) ?? 0;

    const remainingToInvoice = Math.max(0, orderedQty - invoicedQty);

    return {
      id: it.id,
      productId: it.productId,
      draftProductId: it.productId,

      // ✅ your FE expects poItemId; your DB uses it.id
      poItemId: it.id,

      sku: undefined,
      name: it.product?.name ?? it.name ?? "",
      unit: it.unit ?? "",
      quantity: orderedQty,
      unitPrice: Number(it.unitPrice),
      lineTotal: Number(it.lineTotal),

      // ✅ NEW
      remainingToInvoice,
      invoicedQty,
    };
  });

  // Optional PO-level summary (useful for hover UI)
  const remainingToInvoiceCount = items.filter((x: any) => (x.remainingToInvoice ?? 0) > 0).length;
  const remainingToInvoiceQty = items.reduce((s: number, x: any) => s + Number(x.remainingToInvoice ?? 0), 0);

  return {
    id: po.id,
    poNumber: po.poNumber,
    supplierId: po.supplierId,
    supplier: po.supplier
      ? {
          supplierId: po.supplier.supplierId,
          name: po.supplier.name,
          email: po.supplier.email,
          phone: po.supplier.phone,
          address: po.supplier.address,
        }
      : undefined,

    status: po.status as POStatus,
    orderDate: po.orderDate instanceof Date ? po.orderDate.toISOString() : po.orderDate,
    dueDate: po.dueDate ? (po.dueDate instanceof Date ? po.dueDate.toISOString() : po.dueDate) : undefined,
    notes: po.notes ?? undefined,

    items,

    subtotal: Number(po.subtotal),
    tax: Number(po.tax),
    total: Number(po.total),

    invoiceCount: po._count?.invoices ?? po.invoices?.length ?? 0,

    // ✅ Optional but very handy for FE
    remainingToInvoiceCount,
    remainingToInvoiceQty,
  };
}


export const listPurchaseOrders = async (req: Request, res: Response) => {
  try {
    const { status, q } = req.query as Partial<{ status: string; q: string }>;
    const where: any = {};

    if (
      status &&
      ["DRAFT", "APPROVED", "SENT", "PARTIALLY_RECEIVED", "RECEIVED", "CLOSED"].includes(status)
    ) {
      where.status = status as POStatus;
    }

    if (q && q.trim()) {
      where.OR = [
        { poNumber: { contains: q, mode: "insensitive" } },
        { supplier: { is: { name: { contains: q, mode: "insensitive" } } } },
      ];
    }

        const rows = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        items: { include: { product: true } },

        // ✅ add this (minimal fields only)
        invoices: {
          select: {
            id: true,
            items: { select: { poItemId: true, quantity: true } },
          },
        },

        grns: true,
        _count: { select: { invoices: true } },
      },
      orderBy: { orderDate: "desc" },
    });

    // ✅ Compute per PO item: invoicedQty + remainingToInvoice
    const mapped = rows.map((po) => {
      const invoicedByPoItemId = new Map<string, number>();

      for (const inv of po.invoices ?? []) {
        for (const it of inv.items ?? []) {
          if (!it.poItemId) continue;
          const prev = invoicedByPoItemId.get(it.poItemId) ?? 0;
          invoicedByPoItemId.set(it.poItemId, prev + Number(it.quantity ?? 0));
        }
      }

      const itemsWithRemaining = po.items.map((poi) => {
        const orderedQty = Number(poi.quantity ?? 0);
        const invoicedQty = invoicedByPoItemId.get(poi.id) ?? 0;
        const remainingToInvoice = Math.max(0, orderedQty - invoicedQty);

        return {
          ...poi,
          orderedQty,
          invoicedQty,
          remainingToInvoice,
          fullyInvoiced: remainingToInvoice === 0,
        };
      });

      const hasRemainingToInvoice = itemsWithRemaining.some((i) => i.remainingToInvoice > 0);

      return {
        ...toPurchaseOrderDTO(po),
        // ✅ add fields the picker/UI can use
        items: itemsWithRemaining.map((x) => ({
          id: x.id,
          name: x.product?.name,
          unit: x.unit,
          quantity: Number(x.quantity),
          unitPrice: Number(x.unitPrice ?? 0),
          lineTotal: Number(x.lineTotal ?? 0),
          productId: x.productId,
          draftProductId: x.promotedProductId,
          // ✅ extra computed fields
          orderedQty: x.orderedQty,
          invoicedQty: x.invoicedQty,
          remainingToInvoice: x.remainingToInvoice,
          fullyInvoiced: x.fullyInvoiced,
        })),
        hasRemainingToInvoice,
      };
    });

    return res.json(mapped);
  } catch (error) {
    console.error("listPurchaseOrders error:", error);
    return res.status(500).json({ message: "Error retrieving purchase orders." });
  }
};


export const getPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { 
        supplier: true, 
        items: { include: { product: true } }, 
        invoices: true, 
        grns: true,
        _count: { select: { invoices: true } },
      },
    });

    if (!po) {
      return res.status(404).json({ message: "Purchase order not found." });
    }

    // Return consistent DTO shape
    return res.json(toPurchaseOrderDTO(po));
  } catch (error) {
    console.error("getPurchaseOrder error:", error);
    return res.status(500).json({ message: "Error retrieving purchase order." });
  }
};

export const getPurchaseOrderById = async(req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ message: "id is required." });

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        _count: { select: { invoices: true, grns: true } },
        items: {
          include: {
            product: true, 
            promotedProduct: true,
            invoiceLines: {
              include: { invoice: true },
            },
            grnLines: {
              include: { grn: true },
            },
          },
        },
        invoices: {
          orderBy: { date: "desc"},
          include: {
            goodsReceipt: true,
            items: {
              include: {
                draftProduct: true,
                product: true,
                poItem: true,
              },
            },
          },
        },
        grns: {
          orderBy: { date: "desc" },
          include: {
            invoice: true,
            lines: {
              include: {
                product: true,
                poItem: true,
                invoiceItem: true,
              },
            },
          },
        },
      },
    });

    if (!po) return res.status(404).json({ message: "Purchase Order not found."})

      return res.json(po)
  } catch (error: any) {
    console.error("getPurchaseOrderById error:", error);
    return res.status(500).json({ message: "Error retrieving purchase order.", debug: error?.message });
  }
}

export const createPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const {
      supplierId,
      supplier,
      items = [],
      poNumber,
      tax = 0,
      orderDate,
      dueDate,
      notes,
      // ignore subtotal/total from client (compute server-side)
    } = req.body;

    // -----------------------------
    // Basic validation
    // -----------------------------
    if ((!supplierId && !supplier) || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "supplierId or supplier, and items are required.",
      });
    }

    const taxNum = Number(tax);
    if (!Number.isFinite(taxNum) || taxNum < 0) {
      return res.status(400).json({ message: "Tax must be a number >= 0." });
    }

    // -----------------------------
    // Validate and normalize item inputs
    // Your schema requires DraftProduct relation, so every item must have a draft id.
    // Support both shapes:
    // - item.draftProductId (preferred)
    // - item.productId (legacy, but in your PO world it means DraftProduct.id)
    // -----------------------------
    const normalizedItems = items.map((it: any, idx: number) => {
      const draftIdRaw =
        typeof it.draftProductId === "string"
          ? it.draftProductId
          : typeof it.productId === "string"
          ? it.productId
          : "";

      const draftProductId = String(draftIdRaw || "").trim();

      const quantity = Number(it.quantity);
      const unitPrice = Number(it.unitPrice);

      if (!draftProductId) {
        throw new Error(`Line ${idx + 1} is missing draftProductId (or productId).`);
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error(`Line ${idx + 1} quantity must be > 0.`);
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new Error(`Line ${idx + 1} unitPrice must be >= 0.`);
      }

      return {
        draftProductId,
        description: typeof it.description === "string" ? it.description : null,
        unit: typeof it.unit === "string" ? it.unit : null,
        quantity: Math.trunc(quantity),
        unitPrice,
        lineTotal: quantity * unitPrice,
      };
    });

    // -----------------------------
    // Validate DraftProduct IDs exist
    // -----------------------------
    const draftIds = Array.from(new Set(normalizedItems.map((x) => x.draftProductId)));
    const foundCount = await prisma.draftProduct.count({
      where: { id: { in: draftIds } },
    });

    if (foundCount !== draftIds.length) {
      return res.status(400).json({
        message: "One or more DraftProduct IDs are invalid.",
      });
    }

    // -----------------------------
    // Compute totals server-side
    // -----------------------------
    const subtotal = normalizedItems.reduce((sum, it) => sum + it.lineTotal, 0);
    const total = subtotal + taxNum;

    // -----------------------------
    // Supplier relation
    // NOTE: connectOrCreate(where: { email }) only works if Supplier.email is UNIQUE.
    // If email is not unique in your schema, remove connectOrCreate and always create.
    // -----------------------------
    const supplierRelation =
      supplierId && String(supplierId).trim()
        ? { supplier: { connect: { supplierId: String(supplierId).trim() } } }
        : supplier?.email?.trim()
        ? {
            supplier: {
              connectOrCreate: {
                where: { email: supplier.email.trim() }, // must be unique in Prisma
                create: {
                  name: String(supplier.name ?? "").trim(),
                  email: supplier.email.trim(),
                  phone: supplier.phone?.trim() || "",
                  address: supplier.address?.trim() || "",
                },
              },
            },
          }
        : {
            supplier: {
              create: {
                name: String(supplier?.name ?? "").trim(),
                email: supplier?.email?.trim() || "",
                phone: supplier?.phone?.trim() || "",
                address: supplier?.address?.trim() || "",
              },
            },
          };

    // -----------------------------
    // Create PO + Items
    // -----------------------------
    const created = await prisma.purchaseOrder.create({
      data: {
        poNumber: poNumber?.trim?.() ? poNumber.trim() : `PO-${Date.now()}`,
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes?.trim?.() ? notes.trim() : null,
        status: POStatus.DRAFT,
        subtotal,
        tax: taxNum,
        total,
        ...supplierRelation,
        items: {
          create: normalizedItems.map((it) => ({
            description: it.description,
            unit: it.unit,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            lineTotal: it.lineTotal,
            // IMPORTANT: match your schema field names
            product: { connect: { id: it.draftProductId } }, // DraftProduct relation
          })),
        },
      },
      include: {
        supplier: true,
        items: { include: { product: true, promotedProduct: true } },
        _count: { select: { invoices: true } },
      },
    });

    return res.status(201).json(toPurchaseOrderDTO(created));
  } catch (error: any) {
    console.error("createPurchaseOrder error:", error);

    // user-facing validation errors
    const msg = String(error?.message || "");
    if (msg.startsWith("Line ") || msg.includes("DraftProduct")) {
      return res.status(400).json({ message: msg });
    }

    return res.status(500).json({ message: "Error creating purchase order." });
  }
};


export const updatePOStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status?: POStatus };

    if (!status || !["DRAFT","APPROVED","SENT","PARTIALLY_RECEIVED","RECEIVED","CLOSED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status },
      include: { 
        supplier: true, 
        items: { include: { product: true, promotedProduct: true } },
        _count: { select: {invoices: true} },
      },
    });

    return res.json(toPurchaseOrderDTO(updated));
  } catch (error) {
    console.error("updatePOStatus error:", error);
    return res.status(500).json({ message: "Error updating purchase order." });
  }
};

/**
 * Defines what data to include when fetching a purchase order
 * - supplier: full supplier details
 * - items: all line items with their product references
 */
const purchaseOrderInclude = {
  supplier: true,
  items: {
    include: {
      product: true, // Draft product reference
      promotedProduct: true, // Promoted inventory product (if exists)
    },
  },
} as const;

/**
 * Builds the Prisma relation object for connecting/creating a supplier
 * 
 * Logic:
 * 1. If supplierId exists → connect to existing supplier
 * 2. If supplier has email → connectOrCreate (find by email or create new)
 * 3. Otherwise → create new supplier
 * 
 * @param input - Object containing supplier data
 * @param input.supplierId - ID of existing supplier (if linking to one)
 * @param input.supplier - New supplier details (if creating one)
 * @returns Prisma relation object for supplier
 */
 export function buildSupplierRelation(input: { supplier?: any; supplierId?: string }) {
  const { supplier, supplierId } = input;

  // Case 1: Link to existing supplier by ID
  if (supplierId) {
    return { supplier: { connect: { supplierId } } };
  }

  // Case 2: Create or find supplier by email
  if (supplier?.email?.trim()) {
    return {
      supplier: {
        connectOrCreate: {
          where: { email: supplier.email.trim() },
          create: {
            name: supplier.name?.trim() || "",
            email: supplier.email.trim(),
            phone: supplier.phone?.trim() || "",
            address: supplier.address?.trim() || "",
          },
        },
      },
    };
  }

  // Case 3: Create new supplier without email check
  return {
    supplier: {
      create: {
        name: supplier?.name?.trim() || "",
        email: supplier?.email?.trim() || "",
        phone: supplier?.phone?.trim() || "",
        address: supplier?.address?.trim() || "",
      },
    },
  };
}


/**
 * Updates an existing purchase order
 * 
 * This function:
 * 1. Extracts the PO ID from URL params
 * 2. Updates basic fields (tax, total, notes, dueDate)
 * 3. Updates supplier relationship (existing or new)
 * 4. Replaces all line items with new ones
 * 5. Recalculates subtotal and total
 * 
 * @param req - Express request object
 * @param req.params.id - The purchase order ID
 * @param req.body - The updated PO data
 * @param res - Express response object
 */
export const updatePurchaseOrder = async (req: Request, res: Response) => {
  const id = req.params.id;
  const { poNumber, total, subtotal, tax, notes, dueDate, orderDate, supplierId, supplier, items = [] } = req.body;

  try {
    // Validate ID exists
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        message: "Invalid purchase order ID",
      });
    }

    // Validate items array
    if (!Array.isArray(items)) {
      return res.status(400).json({
        message: "Items must be an array",
      });
    }

    const existing = await prisma.purchaseOrder.findUnique({
      where: { id },
      select: { _count: { select: { invoices: true, grns: true}}}
    });

    if (!existing) return res.status(404).json({ message: "PO not found"});

    if ((existing._count.invoices > 0 || existing._count.grns > 0 ) && items.length > 0 ) {
      return res.status(400).json({ message: " Cannot edit Purchase Order Items Lines after an invoice or Goods Receipt exist"})
    }

    // Build the update data object
    const data: any = {};

    // Helper to convert date string to ISO-8601 DateTime
    const toISODateTime = (dateStr: string) => {
      if (!dateStr) return null;
      const trimmed = dateStr.trim();
      if (!trimmed) return null;
      // If it's already a full ISO string, return as-is
      if (trimmed.includes('T')) return trimmed;
      // Otherwise, assume it's YYYY-MM-DD and add time
      return `${trimmed}T00:00:00Z`;
    };

    // Update simple fields if provided
    if (poNumber !== undefined) data.poNumber = String(poNumber).trim();
    if (orderDate !== undefined) {
      const isoDate = toISODateTime(orderDate);
      if (isoDate) data.orderDate = isoDate;
    }
    if (dueDate !== undefined) {
      const isoDate = toISODateTime(dueDate);
      data.dueDate = isoDate;
    }
    if (notes !== undefined) data.notes = notes ? String(notes).trim() : null;
    if (tax !== undefined) data.tax = Number(tax);
    if (total !== undefined) data.total = Number(total);
    if (subtotal !== undefined) data.subtotal = Number(subtotal);

    // Update supplier if provided
    if (supplierId !== undefined || supplier !== undefined) {
      Object.assign(data, buildSupplierRelation({ supplier, supplierId }));
    }

    // Update items if provided
    if (items.length > 0) {
      const createItems = items.map((item: any, idx: number) => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;

        // Validate: each item must have a productId (existing draft)
        const hasDraftId =
          typeof item.productId === "string" && item.productId.trim().length > 0;

        if (!hasDraftId) {
          throw new Error(
            `Item ${idx + 1}: Must have a productId (existing draft product)`
          );
        }

        // Validate quantity
        if (!Number.isFinite(quantity) || quantity <= 0) throw new Error(`Item ${idx + 1}: Quantity must be > 0`);
        if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error(`Item ${idx + 1}: Unit price must be >= 0`);

        // Map to PurchaseOrderItem fields (no 'name' field on item itself)
        const mappedItem: any = {
          description: item.description ? String(item.description).trim() : null,
          unit: item.unit ? String(item.unit).trim() : null,
          unitPrice: unitPrice,
          quantity: quantity,
          lineTotal: unitPrice * quantity,
          // Connect to existing draft product
          product: { connect: { id: item.productId.trim() } },
        };

        return mappedItem;
      });

      // Calculate new subtotal from items
      const calculatedSubtotal = createItems.reduce(
        (sum: number, it: any) => sum + Number(it.quantity) * Number(it.unitPrice),
        0
      );

      data.subtotal = calculatedSubtotal;
      data.tax = Number(tax) || 0;
      data.total = calculatedSubtotal + (data.tax || 0);

      // Replace all items (delete old, create new)
      data.items = {
        deleteMany: {}, // Delete all existing items
        create: createItems,
      };

      
    }


    // Perform the update
    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data,
      include: purchaseOrderInclude,
    });

    console.log("Updated successfully. Items count:", updated.items.length);

    res.status(200).json(toPurchaseOrderDTO(updated));
  } catch (error: any) {
    console.error("❌ updatePurchaseOrder error:", error);
    
    

    // Return appropriate status code based on error type
    const statusCode = error.message?.includes("not found") ? 404 : 500;

    return res.status(statusCode).json({
    });
  }
};
// TODO: Append Controller Logic 

export const deletePurchaseOrder = async (req: Request, res: Response) => {
  const { id: purchaseOrderId } = req.params;

  if (!purchaseOrderId) {
    return res.status(400).json({
      message: "Unable to delete purchase order. Missing purchase order ID.",
    });
  }

  try {

    const existing = await prisma.purchaseOrder.findUnique({
      where: {id: purchaseOrderId},
      select: { _count: { select: { invoices: true, grns: true }}}
    });

    if (!existing) return res.status(404).json({ message: "PurchaseOrder not found"}
    )
    if (existing._count.invoices > 0 || existing._count.grns > 0) {
      return res.status(400).json({ message: "Cannot delete a purchase order thatn has an invoice or goods receipt."})
    }
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Get all items in this PO
      const items = await tx.purchaseOrderItem.findMany({
        where: { poId: purchaseOrderId },
        select: { productId: true },
      });

      const productIds = items.map((item) => item.productId);

      // Step 2: Delete the PO (this cascades and deletes all PurchaseOrderItems)
      const deletedPurchase = await tx.purchaseOrder.delete({
        where: { id: purchaseOrderId },
      });

      // Step 3: Find draft products that are ONLY used by this PO
      // (i.e., they have no other PO items pointing to them)
      const orphanedProducts = await tx.draftProduct.findMany({
        where: {
          id: { in: productIds },
          poItems: {
            none: {}, // No remaining PO items
          },
          // Also check they're not used in supplier invoices or goods receipts
          invoiceItems: {
            none: {},
          },
          grnItems: {
            none: {},
          },
        },
        select: { id: true },
      });

      const orphanedProductIds = orphanedProducts.map((p) => p.id);

      // Step 4: Delete the orphaned draft products
      let deletedProductCount = 0;
      if (orphanedProductIds.length > 0) {
        const deletedProducts = await tx.draftProduct.deleteMany({
          where: {
            id: { in: orphanedProductIds },
          },
        });
        deletedProductCount = deletedProducts.count;
      }

      return {
        orderId: purchaseOrderId,
        deletedItemsCount: items.length,
        deletedProductCount: deletedProductCount,
      };
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Deletion transaction failed:", error);
    
    // Check if PO doesn't exist
    if (error.code === "P2025") {
      return res.status(404).json({
        message: "Purchase order not found.",
      });
    }

    return res.status(500).json({
      message: "Failed to delete the purchase order and associated products.",
      error: error.message,
    });
  }
};
