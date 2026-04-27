import { treeifyError } from "zod";
import { prisma } from "../lib/prisma";
import { Request, Response } from "express";
import { getSupplierAnalytics } from "../services/supplierAnalytics.service.ts"



export async function getSuppliers(req: Request, res: Response) {
  try {
    const search = String(req.query.search ?? "").trim();

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { supplierId: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : undefined;

    const [total, items] = await Promise.all([
      prisma.supplier.count({ where }),

      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "asc" },
        include: {
          purchaseOrders: {
            select: {
              orderDate: true,
            },
            orderBy: {
              orderDate: "asc",
            },
          },
        },
      }),
    ]);

    return res.json({
      suppliers: items,
      total,
      totalPages: Math.ceil(total / limit),
      limit,
      page,
    });
  } catch (error: any) {
    console.error("Failed to get suppliers:", error);
    return res.status(500).json({ message: "Failed to get suppliers" });
  }
}

export async function getSupplierSummary(req: Request, res: Response) {
    const { supplierId } = req.params
    try {
        if (!supplierId) {
            return res.status(404).json("Supplier Id required")
        }
        const analytics = await getSupplierAnalytics(supplierId)
        return res.json(analytics)
    } catch (error: any) {
        console.error("Failed to get supplier analytics:", error);

    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to get supplier analytics",
    });
    }
}

