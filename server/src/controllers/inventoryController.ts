import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";

//const prisma = new PrismaClient();


export async function getInventory( req: Request, res: Response) {
    try {
        const products = await prisma.products.findMany({
            include:{ inventory: true}, 
            orderBy: {
                name: "asc"
            },
        });

        const rows = products.map((p) => ({
            id: p.inventory?.id ?? `missing-${p.productId}`,
            productId: p.productId,
            expiryDate: p.expiryDate,
            category: p.category,
            name: p.name,
            stockQuantity: p.inventory?.stockQuantity ?? p.stockQuantity ?? 0,
            minQuantity: p.minQuantity ?? p.minQuantity ?? 0,
            reorderPoint: p.inventory?.reorderPoint ?? p.reorderPoint ?? 0,
            lastCounted: p.inventory?.lastCountedAt
                ? p.inventory.lastCountedAt.toISOString()
                : "",
        }))
        res.json(rows)
    } catch (error) {
        res.status(500).json({ message: "Error getting inventory"})
    }
}

export async function adjustInventory(req:Request, res: Response) {
    try {
        const { productId, delta: rawDelta, reason } = req.body;
        const delta = Number(rawDelta)

        if(!productId || !Number.isFinite(delta)) {
            return res.status(400).json({ message: "productId and Delta are required"})
        }

        const existing = await prisma.inventory.findUnique({
            where: {productId}
        })

        if (!existing) {
      // there is **no inventory** row for this productId
        return res.status(404)
        .json({ message: `Inventory row not found for productId ${productId}` });
        }

        const updatedInventory = await prisma.$transaction( async (tx)=> {

            const updatedStock = await tx.inventory.update({
                where: {productId},
                data: { stockQuantity: { increment: delta }}
            })

            await tx.products.update({
                where: {productId},
                data: { stockQuantity: {increment: delta}} //stock :{ inventory.StockQuantty}
            })

            const userId: string | undefined = (req as any).user?.id || (req as any).user?.userId || undefined;

            await tx.stockLedger.create({
                data: {
                    productId,
                    userId,
                    sourceType: "ADJUSTMENT",
                    SourceId: productId,
                    qtyChange: delta,
                    memo: reason ?? null
                }
            })
            return updatedStock
        })
        console.log("Inventory and product item has been...")
        // TODO: write to stockLedger({productId, delta, reason, userId, ts})
        return res.json(updatedInventory)
    } catch (error) {
        return res.status(500).json({ message: "Inventory row not found for productId"})
    }
}


export async function setInventory(req:Request, res:Response) {
    try {
        const { productId,  stockQuantity, lastCounted } = req.body;

        if (!productId || !Number.isInteger(stockQuantity)) {
            return res.status(400).json({ error: "Product Id and Stock Quantity is required"})
        }

        const current = await prisma.inventory.findUnique({where: { productId}});
        if (!current) return res.status(404).json({ error: "Inventory row not found for productId"})
            const delta = stockQuantity - current.stockQuantity;

        const finalStockCount = await prisma.$transaction( async (tx) => {
            await tx.inventory.update({
                where: {productId},
                data: { stockQuantity, lastCountedAt: lastCounted ? new Date(lastCounted) : null}
            })
            // update Products
            await tx.products.update({
                where: {productId},
                data: {stockQuantity},
            })
            //Update the StockLEdger
            const userId = (req as any).user?.id || (req as any).user?.userId || undefined
            if (!userId)
                return res.status(401).json({ error: "Not Authorized"})
            
            await tx.stockLedger.create({
                data: {
                    productId,
                    userId,
                    SourceId: productId,
                    sourceType: "STOCKTAKE",
                    qtyChange: delta,
                }
            })
            //return finalStockCount
        })
        return res.json(finalStockCount)
    } catch (error) {
        return res.status(500).json({ message: "Inventory row not found for productId"})
    }
}


export async function getInventoryWithoutExpiry(req: Request, res: Response) {
  try {
    const missingExpiryDate = await prisma.products.findMany({
      where: {
        expiryDate: null,
      },
      include: {
        inventory: true, // so you also get minQuantity/reorderPoint/stockQuantity
      },
      orderBy: { updatedAt: "desc" },
    });

    return res.json(missingExpiryDate);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "failed to get inventory without expiry date." });
  }
}

// controllers/inventoryController.ts



const updateInventoryMetaSchema = z.object({
  expiryDate: z.string().datetime().nullable().optional(), // ISO string or null
  minQuantity: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional(),
});

export async function updateInventoryMeta(req: Request, res: Response) {
  try {
    const { productId } = req.params;

    const parsed = updateInventoryMetaSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid payload",
        issues: parsed.error.issues,
      });
    }

    const { expiryDate, minQuantity, reorderPoint } = parsed.data;

    // Convert expiryDate ISO -> Date (or null)
    let expiryAsDate: Date | null | undefined = undefined;
    if (expiryDate !== undefined) {
      expiryAsDate = expiryDate === null ? null : new Date(expiryDate);
      if (expiryAsDate !== null && Number.isNaN(expiryAsDate.getTime())) {
        return res.status(400).json({ message: "Invalid expiryDate" });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Ensure product exists
      const product = await tx.products.findUnique({
        where: { productId },
        select: { productId: true },
      });

      if (!product) {
        return null;
      }

      // Update product expiryDate if provided
      if (expiryAsDate !== undefined) {
        await tx.products.update({
          where: { productId },
          data: { expiryDate: expiryAsDate },
        });
      }

      // Update inventory thresholds if provided
      if (minQuantity !== undefined || reorderPoint !== undefined) {
        await tx.inventory.upsert({
          where: { productId },
          create: {
            productId,
            minQuantity: minQuantity ?? 0,
            reorderPoint: reorderPoint ?? 0,
            stockQuantity: 0,
          },
          update: {
            ...(minQuantity !== undefined ? { minQuantity } : {}),
            ...(reorderPoint !== undefined ? { reorderPoint } : {}),
          },
        });
      }

      // Return updated snapshot for UI
      const updated = await tx.products.findUnique({
        where: { productId },
        include: { inventory: true },
      });

      return updated;
    });

    if (!result) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update inventory meta." });
  }
}

