import { treeifyError } from "zod";
import { prisma } from "../lib/prisma";
import { Request, Response } from "express";
import { getSupplierAnalytics } from "../services/supplierAnalytics.service.ts"

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