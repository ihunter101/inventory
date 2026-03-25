// src/controllers/draftProductController.ts
import { Request, Response } from "express";
import { prisma } from "../lib/prisma"; // adjust import

export const listDraftProducts = async (_req: Request, res: Response) => {
  try {
    const drafts = await prisma.draftProduct.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, unit: true },
    });
    return res.json(drafts);
  } catch (err) {
    console.error("listDraftProducts error:", err);
    return res.status(500).json({ message: "Error fetching draft products." });
  }
};

export const createDraftProduct = async (req: Request, res: Response) => {
  try {
    const name = String(req.body.name).trim();
    const unit = (req.body.unit ?? "").toString().trim(); // normalize null -> ""

    const existing = await prisma.draftProduct.findFirst({
      where: { name, unit },
      });

    const draft = existing
      ? existing
      : await prisma.draftProduct.create({
        data: { name, unit },
      });


    return res.status(201).json(draft);
  } catch (e) {
    console.error("createDraftProduct error:", e);
    return res.status(500).json({ message: "Error creating draft product" });
  }
};

// server/src/controllers/draftProductController.ts
export const getPendingArrivals = async (req: Request, res: Response) => {
  try {
    const grnId = String(req.query.grnId || "").trim();
    if (!grnId) return res.status(400).json({ message: "grnId is required" });

    // get lines for THIS grn, then return the linked draft products
    const lines = await prisma.goodsReceiptItem.findMany({
      where: { grnId },
      select: {
        productDraftId: true,
        receivedQty: true,
        product: { select: { id: true, name: true, unit: true } }, // DraftProduct
      },
    });

    // dedupe by draft id (and optionally sum qty)
    const map = new Map<string, { id: string; name: string; unit: string; receivedQty: number }>();
    for (const ln of lines) {
      const dp = ln.product;
      if (!dp) continue;
      const prev = map.get(dp.id);
      map.set(dp.id, {
        id: dp.id,
        name: dp.name,
        unit: dp.unit ?? "",
        receivedQty: (prev?.receivedQty ?? 0) + (ln.receivedQty ?? 0),
      });
    }

    return res.json(Array.from(map.values()));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Error fetching pending arrivals" });
  }
};


export const bulkFinalizeProducts = async (req: Request, res: Response) => {
  try {
    const { updates } = req.body as {
      updates: Array<{
        productId: string; // draftProductId
        category?: string;
        department?: string;
        imageUrl?: string;
      }>;
    };

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ message: "Invalid updates array" });
    }

    const results = await prisma.$transaction(async (tx) => {

      for (const u of updates) {
        const draftId = u.productId;
        const draft = await tx.draftProduct.findUnique({ where: { id: draftId } });

        if (!draft) throw new Error(`Draft product ${draftId} not found`);

        const realProduct = await prisma.products.upsert({
          where: {  sku: draft.name },
          update: {
            ...(u.category && { category: u.category }),
            ...(u.department && { Department: u.department }),
            ...(u.imageUrl && { imageUrl: u.imageUrl }),
          },
          create: {
            productId: draftId,
            name: draft.name,
            unit: draft.unit ??  "unit",
            category: u.category ?? "misc",
            Department: u.department ?? "misc",
            imageUrl: u.imageUrl ?? "",
            stockQuantity: 0,
          }
        })

        // Link GRN lines to real product
        const updateResult = await tx.goodsReceiptItem.updateMany({
          where: { productDraftId: draftId, productId: null },
          data: { productId: realProduct.productId },
        });

        const grnLines = await tx.goodsReceiptItem.findMany({
          where: { productDraftId: draftId, productId: realProduct.productId },
        });

        const totalReceived = grnLines.reduce((sum, ln) => sum + Number(ln.receivedQty ?? 0), 0);

          // Update Product aggregate
          await tx.products.update({
            where: { productId: realProduct.productId },
            data: { stockQuantity: { increment: totalReceived } },
          });
        }
      });
       
      return res.json({ ok: true, results });

  } catch (error) {
    console.error("❌ Error:", error);
    return res.status(500).json({ message: "Error finalizing products" });
  }
};

export const getPendingPromotions = async (req: Request, res: Response) => {
  try {
    const grnId = String(req.query.grnId || "").trim();

    // ✅ Find all GoodsReceiptItem records where:
    // - productId is NULL (not promoted yet)
    // - GRN status is POSTED (finalized receipts only)
    const lines = await prisma.goodsReceiptItem.findMany({
      where: {
        ...(grnId ? { grnId } : {}), // optional: filter by specific GRN
        productId: null,              // ✅ NOT promoted yet
        //grn: { status: "POSTED" }     // ✅ only from POSTED GRNs
      },
      select: {
        id: true,
        grnId: true,
        productDraftId: true,
        receivedQty: true,
        product: {                    // this is the DraftProduct relation
          select: { 
            id: true, 
            name: true, 
            unit: true 
          }
        },
        grn: {
          select: {
            grnNumber: true,
            date: true
          }
        }
      },
    });

    console.log(`📦 Found ${lines.length} unpromoted GRN items`);

    // ✅ Group by draft product ID and sum quantities
    const map = new Map<string, { 
      id: string; 
      name: string; 
      unit: string; 
      receivedQty: number;
      grnCount: number;
      grnNumbers: string[];
    }>();

    for (const ln of lines) {
      const dp = ln.product;
      if (!dp) continue;

      const prev = map.get(dp.id);
      const grnNumber = ln.grn?.grnNumber || 'Unknown';
      
      map.set(dp.id, {
        id: dp.id,
        name: dp.name,
        unit: dp.unit ?? "",
        receivedQty: (prev?.receivedQty ?? 0) + Number(ln.receivedQty ?? 0),
        grnCount: (prev?.grnCount ?? 0) + 1,
        grnNumbers: [...(prev?.grnNumbers ?? []), grnNumber]
      });
    }

    const result = Array.from(map.values());
    console.log(`✅ Returning ${result.length} unique draft products to promote`);

    return res.json(result);
  } catch (e) {
    console.error("❌ Error fetching pending promotions:", e);
    return res.status(500).json({ message: "Error fetching pending promotions" });
  }
};



// GET /draft-products/pending-promotions/count
export const getPendingPromotionsCount = async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.goodsReceiptItem.findMany({
      where: {
        productId: null,
        //grn: { status: "POSTED" },
      },
      select: { productDraftId: true },
      distinct: ["productDraftId"],
    });

    return res.json({ count: rows.length });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Error fetching pending promotions count" });
  }
};


