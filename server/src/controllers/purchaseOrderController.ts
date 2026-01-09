import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { POStatus } from "@prisma/client";
import it from "zod/v4/locales/it.js";
import { create } from "domain";

//const prisma = new PrismaClient();

/** Frontend-friendly mapper: flattens supplier, coerces Decimals/Dates 
 ** This decides what JSON fields your API actually sends to the frontend.
 **Cleans up the prisma messy response into a format compactible with the frontend.
*/
function toPurchaseOrderDTO(po: any) {
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
      address: po.supplier.address
      } 
    : undefined,       // string for FE
    status: po.status as POStatus,
    orderDate: po.orderDate instanceof Date ? po.orderDate.toISOString() : po.orderDate,
    dueDate: po.dueDate ? (po.dueDate instanceof Date ? po.dueDate.toISOString() : po.dueDate) : undefined,
    notes: po.notes ?? undefined,
    items: (po.items ?? []).map((it: any) => ({
      id: it.id,
      productId: it.productId,
      draftProductId: it.productId,
      poItemId: it.poItemId,
      sku: undefined,                                    // FE has optional sku
      name: it.product?.name ?? it.name,    //draftproduct name     // FE expects "name"
      unit: it.unit ?? "",
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),                   // Decimal -> number
      lineTotal: Number(it.lineTotal),
    })),
    subtotal: Number(po.subtotal),
    tax: Number(po.tax),
    total: Number(po.total),
    invoiceCount: po._count?.invoices ?? po.invoices?.length ?? 0,
  };
}

export const listPurchaseOrders = async (req: Request, res: Response) => {
  try {
    const { status, q } = req.query as Partial<{ status: string; q: string }>;
    const where: any = {};

    // Normalize status to enum if provided & valid
    if (status && ["DRAFT","APPROVED","SENT","PARTIALLY_RECEIVED","RECEIVED","CLOSED"].includes(status)) {
      where.status = status as POStatus;
    }

    if (q && q.trim()) {
      where.OR = [
        { poNumber: { contains: q, mode: "insensitive" } },
        { supplier: { is: { name: { contains: q, mode: "insensitive" } } } }, // canonical form
      ];
    }

    const rows = await prisma.purchaseOrder.findMany({
      where,
      include: { 
        supplier: true, 
        items: {
          include: { product: true} // so we can get the name
        },
        grns: true,
        _count: { select: { invoices: true } },
      },
      orderBy: { orderDate: "desc" },
    });

    return res.json(rows.map(toPurchaseOrderDTO));
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
    } = req.body;

    if ((!supplierId && !supplier) || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "supplierId or supplier, and items are required." });
    }

    // validate numbers
    for (const it of items) {
      const qty = Number(it.quantity);
      const price = Number(it.unitPrice);
      if (!Number.isFinite(qty) || qty <= 0) {
        return res.status(400).json({ message: "Each item must have quantity > 0." });
      }
      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({ message: "Each item must have unitPrice >= 0." });
      }
    }

    // ✅ Validate draftProduct IDs ONCE (outside map)
    const draftIds = Array.from(
      new Set(
        items
          .map((it: any) => (typeof it.productId === "string" ? it.productId.trim() : ""))
          .filter(Boolean)
      )
    );

    if (draftIds.length) {
      const found = await prisma.draftProduct.count({
        where: { id: { in: draftIds } },
      });

      if (found !== draftIds.length) {
        return res.status(400).json({ message: "One or more DraftProduct IDs are invalid." });
      }
    }

    const subtotal = items.reduce(
      (sum: number, item: any) => sum + Number(item.quantity) * Number(item.unitPrice),
      0
    );
    const total = subtotal + Number(tax);

    const supplierRelation =
      supplierId
        ? { supplier: { connect: { supplierId } } }
        : supplier?.email?.trim()
        ? {
            supplier: {
              connectOrCreate: {
                where: { email: supplier.email.trim() },
                create: {
                  name: supplier.name.trim(),
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
                name: supplier.name.trim(),
                email: supplier.email?.trim() || "",
                phone: supplier.phone?.trim() || "",
                address: supplier.address?.trim() || "",
              },
            },
          };

    const created = await prisma.purchaseOrder.create({
      data: {
        poNumber: poNumber ?? `PO-${Date.now()}`,
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        status: "DRAFT",
        subtotal,
        tax: Number(tax),
        total,
        ...supplierRelation,
        items: {
          create: items.map((item: any) => {
            const quantity = Number(item.quantity);
            const unitPrice = Number(item.unitPrice);

            const hasDraftId =
              typeof item.productId === "string" && item.productId.trim().length > 0;

            const hasName =
              typeof item.name === "string" && item.name.trim().length > 0;

            if (!hasDraftId && !hasName) {
              throw new Error("DraftProduct missing: item has no productId and no name to create one.");
            }

            return {
              description: item.description ?? "",
              unit: item.unit ?? "",
              quantity,
              unitPrice,
              lineTotal: quantity * unitPrice,

              product: hasDraftId
                ? { connect: { id: item.productId.trim() } }
                : {
                    create: {
                      name: String(item.name).trim(),
                      unit: String(item.unit ?? "").trim(),
                    },
                  },
            };
          }),
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
    if (String(error?.message || "").includes("DraftProduct missing")) {
      return res.status(400).json({ message: error.message });
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
          supplierItems: {
            none: {},
          },
          goodsReciept: {
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

