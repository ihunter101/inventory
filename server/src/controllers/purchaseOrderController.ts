import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { POStatus } from "@prisma/client";

//const prisma = new PrismaClient();

/** Frontend-friendly mapper: flattens supplier, coerces Decimals/Dates */
function toPurchaseOrderDTO(po: any) {
  return {
    id: po.id,
    poNumber: po.poNumber,
    supplierId: po.supplierId,
    supplier: po.supplier?.name ?? undefined,            // string for FE
    status: po.status as POStatus,
    orderDate: po.orderDate instanceof Date ? po.orderDate.toISOString() : po.orderDate,
    dueDate: po.dueDate ? (po.dueDate instanceof Date ? po.dueDate.toISOString() : po.dueDate) : undefined,
    notes: po.notes ?? undefined,
    items: (po.items ?? []).map((it: any) => ({
      id: it.id,
      productId: it.productId,
      sku: undefined,                                    // FE has optional sku
      name: it.description ?? "",                        // FE expects "name"
      unit: it.unit ?? "",
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),                   // Decimal -> number
      lineTotal: Number(it.lineTotal),
    })),
    subtotal: Number(po.subtotal),
    tax: Number(po.tax),
    total: Number(po.total),
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
      include: { supplier: true, items: true },
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
      include: { supplier: true, items: true, invoices: true, grns: true },
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
    const { supplierId, items = [], poNumber, tax = 0, orderDate, dueDate, notes } = req.body;

    if (!supplierId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "supplierId and items are required." });
    }

    const subtotal = items.reduce(
      (sum: number, item: any) => sum + Number(item.quantity) * Number(item.unitPrice),
      0
    );
    const total = subtotal + Number(tax);

    const created = await prisma.purchaseOrder.create({
      data: {
        poNumber: poNumber ?? `PO-${Date.now()}`,
        supplierId,
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        status: "DRAFT",
        subtotal,
        tax: Number(tax),
        total,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            description: item.description ?? item.name ?? "", // accept FE naming
            unit: item.unit,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            lineTotal: Number(item.quantity) * Number(item.unitPrice),
          })),
        },
      },
      include: { supplier: true, items: true },
    });

    // Return the same flattened DTO shape
    return res.status(201).json(toPurchaseOrderDTO(created));
  } catch (error) {
    console.error("createPurchaseOrder error:", error);
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
      include: { supplier: true, items: true },
    });

    return res.json(toPurchaseOrderDTO(updated));
  } catch (error) {
    console.error("updatePOStatus error:", error);
    return res.status(500).json({ message: "Error updating purchase order." });
  }
};
