import { Request, Response } from "express";
import { GRNStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

//const prisma = new PrismaClient();

const toGRNDTO = (g: any) => ({
  id: g.id,
  grnNumber: g.grnNumber,
  poId: g.poId,
  poNumber: g.po?.poNumber,                 // ⬅️ NEW
  invoiceId: g.invoiceId ?? undefined,
  invoiceNumber: g.invoice?.invoiceNumber,   // ⬅️ NEW
  date: g.date instanceof Date ? g.date.toISOString() : g.date,
  status: g.status as GRNStatus,
  lines: (g.lines ?? []).map((ln: any) => ({
    poItemId: ln.poItemId ?? undefined,
    draftProductId: ln.productDraftId,
    //sku: ln.product?.sku ?? undefinedd
    //productId: ln.productId,  
    name: ln.product?.name ?? ln.name,
    unit: ln.unit ?? "",
    receivedQty: Number(ln.receivedQty),
    unitPrice: ln.unitPrice == null ? undefined : Number(ln.unitPrice),
  })),
});

export const listGoodsReceipts = async (req: Request, res: Response) => {
  try {
    const { q } = req.query as { q?: string };

    const where: Prisma.GoodsReceiptWhereInput | undefined = q
      ? {
          OR: [
            { grnNumber: { contains: q, mode: "insensitive" } },
            { po: { poNumber: { contains: q, mode: "insensitive" } } },           // search by poNumber
            { invoice: { invoiceNumber: { contains: q, mode: "insensitive" } } }, // search by invoiceNumber
          ],
        }
      : undefined;

    const rows = await prisma.goodsReceipt.findMany({
      where,
      include: {
        po: true,
        invoice: true,
        lines: { include: { product: true } },
      },
      orderBy: { date: "desc" },
    });

    return res.json(rows.map(toGRNDTO));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving goods receipts." });
  }
};

export const getGoodReceiptById = async (req: Request, res: Response) => {
  const {id} = req.params

  try {
    const goodsReceipt = await prisma.goodsReceipt.findUnique({
    where: {id},
    include: {
      lines: {
        include: {
          product: true,
        promotedProduct: true,
        poItem: true,
        },
      },
      po: true,
      invoice: true
    }
  })
  if (!goodsReceipt) {
    return res.status(404).json({message: "Goods Receipt not found."})
  }
  return res.json(toGRNDTO(goodsReceipt))
  } catch (error) {
    console.error(error)
    return res.status(500).json({Error: "Failed to get goods Receipt"})
  }
  
}

export const createGoodsReceipt = async (req: Request, res: Response) => {
  try {
    const { grnNumber, poId, invoiceId, date, lines = [] } = req.body;

    if (!poId || !invoiceId || !Array.isArray(lines) || lines.length === 0) {
  return res.status(400).json({
    error: "Purchase order ID, invoice ID and line items are required",
  });
}


    //validate that an invoice belongs to a purchase order id and that the invoice has no goods Receipt Attached yet
    const invoice = await prisma.supplierInvoice.findUnique({
      where: {id: invoiceId},
      select: { 
        id: true, 
        poId: true, 
        GoodsReceipt: { select: { id: true}}
      },
    });

    if (!invoice) return res.status(404).json({ message: "invoice not found."});
    if (invoice.poId !== poId) return res.status(400).json({ message: "Invoice does not belong to this purchase order"})
    if (invoice.GoodsReceipt?.length) {
      return res.status(400).json({ message: "This invoice already has a goods receipt." });
    }  
    
    const poItemIds = lines.map((l: any) => typeof l.poItemId === "string" ? l.poItemId.trim() : "").filter(Boolean);

    if (poItemIds.length) {
      const count = await prisma.purchaseOrderItem.count({
        where: {id: { in: poItemIds }, poId },
      });

      if (count !== poItemIds.length) {
        return res.status(400).json({ message: "One or more Purchase order items IDs does not belong to this purchase order."})
      }
    }
    const created = await prisma.goodsReceipt.create({
      data: {
        grnNumber: grnNumber ?? `GRN-${Date.now()}`,
        poId,
        invoiceId: invoiceId ?? null,
        date: date ? new Date(date) : new Date(),
        status: GRNStatus.DRAFT,
        lines: {
          create: lines.map((line: any) => ({
            poItemId: line.poItemId,
            //product: { connect: { id: String(line.productDraftId) } },
            productDraftId: String(line.productDraftId ?? line.draftProductId ?? line.draftProductId).trim(),
            unit: String(line.unit ?? line.uom ?? ""),
            receivedQty: Number(line.receivedQty ?? 0),
            unitPrice: Number(line.unitPrice ?? 0),
          })),
          
        },
      },
      include: {
        po: true,                            // ⬅️ include to expose poNumber
        invoice: true,                       // ⬅️ include to expose invoiceNumber
        lines: { include: { product: true } },
      },
    });
    

    return res.status(201).json(toGRNDTO(created));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error creating goods receipt." });
  }
};

// server/src/controllers/grnController.ts


export const postGoodsReceipt = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const goodsReceipt = await prisma.goodsReceipt.findUnique({
      where: { id },
      include: {
        lines: true,              // must include poItemId + receivedQty + productDraftId
        po: { include: { items: true } },
      },
    });

    if (!goodsReceipt) {
      return res.status(404).json({ message: "Goods receipt not found." });
    }

    if (goodsReceipt.status === GRNStatus.POSTED) {
      return res.json({ ok: true });
    }

    // ✅ must have poItemId to update PO status reliably
    const missingPoItemId = goodsReceipt.lines.some((ln) => !ln.poItemId);
    if (missingPoItemId) {
      return res.status(400).json({
        message:
          "Cannot POST this GRN because one or more lines are missing poItemId.",
      });
    }

    // ✅ must have a draft product (since we are NOT promoting on post)
    const missingDraft = goodsReceipt.lines.some((ln) => !ln.productDraftId);
    if (missingDraft) {
      return res.status(400).json({
        message:
          "Cannot POST this GRN because one or more lines are missing productDraftId.",
      });
    }

    await prisma.$transaction(async (tx) => {
      // 1) mark GRN POSTED (no promotion, no inventory updates)
      await tx.goodsReceipt.update({
        where: { id: goodsReceipt.id },
        data: { status: GRNStatus.POSTED },
      });

      // 2) recompute PO status based on all POSTED GRNs for this PO
      const posted = await tx.goodsReceipt.findMany({
        where: { poId: goodsReceipt.poId, status: GRNStatus.POSTED },
        include: { lines: true },
      });

      const receivedByPoItemId = new Map<string, number>();

      for (const g of posted) {
        for (const ln of g.lines) {
          if (!ln.poItemId) continue;
          receivedByPoItemId.set(
            ln.poItemId,
            (receivedByPoItemId.get(ln.poItemId) ?? 0) + Number(ln.receivedQty ?? 0)
          );
        }
      }

      const fullyReceived = goodsReceipt.po.items.every((item) => {
        const received = receivedByPoItemId.get(item.id) ?? 0;
        return received >= Number(item.quantity);
      });

      await tx.purchaseOrder.update({
        where: { id: goodsReceipt.poId },
        data: { status: "RECEIVED" },
      });
    });

    return res.json({ ok: true, grnId: goodsReceipt.id, poId: goodsReceipt.poId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error posting goods receipt." });
  }
};


export const deleteGoodsReceipt = async (req: Request, res: Response) => {
  const { id: grnId } = req.params;

  if (!grnId) {
    return res.status(400).json({ message: "GRN ID is required" });
  }

  try {
    const existing = await prisma.goodsReceipt.findUnique({
      where: { id: grnId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existing) {
      return res.status(404).json({ message: "Goods receipt not found." });
    }

    // ✅ Cannot delete posted GRN (it has stock + ledger impact)
    if (existing.status === GRNStatus.POSTED) {
      return res.status(400).json({
        message: "Cannot delete a POSTED goods receipt. Void/reverse it instead.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1) Get draft products referenced by this GRN
      const lines = await tx.goodsReceiptItem.findMany({
        where: { grnId },
        select: { productDraftId: true },
      });

      const draftIds = [...new Set(lines.map((l) => l.productDraftId))];

      // 2) Delete the GRN (cascades to lines)
      await tx.goodsReceipt.delete({
        where: { id: grnId },
      });

      // 3) Delete orphaned draft products (not used anywhere else)
      const orphaned = await tx.draftProduct.findMany({
        where: {
          id: { in: draftIds },
          poItems: { none: {} },
          supplierItems: { none: {} },
          goodsReciept: { none: {} }, // use exact field name from DraftProduct model
        },
        select: { id: true },
      });

      const orphanIds = orphaned.map((p) => p.id);

      const deletedDrafts = orphanIds.length
        ? await tx.draftProduct.deleteMany({ where: { id: { in: orphanIds } } })
        : { count: 0 };

      return {
        grnId,
        deletedLinesCount: lines.length,
        deletedDraftProductCount: deletedDrafts.count,
      };
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("deleteGoodsReceipt error:", error);

    if (error?.code === "P2025") {
      return res.status(404).json({ message: "Goods receipt not found." });
    }

    return res.status(500).json({
      message: "Failed to delete goods receipt.",
      error: error.message,
    });
  }
};





// postGoodsReceipt unchanged






// export const postGoodsReceipt = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;

//     const goodsReceipt = await prisma.goodsReceipt.findUnique({
//       where: { id },
//       include: {
//         lines: true,
//         po: { include: { items: true } },
//       },
//     });

//     if (!goodsReceipt) {
//       return res.status(404).json({ message: "Goods receipt not found." });
//     }

//     if (goodsReceipt.status === "POSTED") {
//       return res.json({ ok: true });
//     }

//     // ✅ RULE: you cannot POST to inventory if any line has no real productId
//     const hasAnyDraftLines = goodsReceipt.lines.some((ln) => !ln.productId);
//     if (hasAnyDraftLines) {
//       return res.status(400).json({
//         message:
//           "Cannot POST this GRN because one or more lines are not linked to a real product yet.",
//       });
//     }

//     await prisma.$transaction(async (tx) => {
//       // 1) increment stock + ledger (safe now because productId is guaranteed)
//       for (const line of goodsReceipt.lines) {
//         // productId must exist because we blocked earlier
//         const pid = line.productId as string;

//         await tx.products.update({
//           where: { productId: pid },
//           data: { stockQuantity: { increment: line.receivedQty } },
//         });

//         await tx.stockLedger.create({
//           data: {
//             productId: pid,
//             sourceType: "GRN",
//             SourceId: goodsReceipt.id,
//             qtyChange: line.receivedQty,
//             memo: `Posted ${goodsReceipt.grnNumber}`,
//           },
//         });
//       }

//       // 2) mark GRN POSTED
//       await tx.goodsReceipt.update({
//         where: { id: goodsReceipt.id },
//         data: { status: GRNStatus.POSTED },
//       });

//       // 3) update PO status based on all posted GRNs for that PO
//       const posted = await tx.goodsReceipt.findMany({
//         where: { poId: goodsReceipt.poId, status: GRNStatus.POSTED },
//         include: { lines: true },
//       });

//       // ✅ IMPORTANT: match by "key" (productId OR draftProductId)
//       // If your GRN lines don't have draftProductId, then just productId is used.
//       const receivedByKey = new Map<string, number>();

//       for (const g of posted) {
//         for (const ln of g.lines) {
//           const key =
//             (ln.productId ?? (ln as any).draftProductId ?? null) as string | null;

//           if (!key) continue;

//           receivedByKey.set(
//             key,
//             (receivedByKey.get(key) ?? 0) + Number(ln.receivedQty)
//           );
//         }
//       }

//       const allOrdered = goodsReceipt.po.items;

//       const fully = allOrdered.every((item: any) => {
//         const key =
//           (item.productId ?? item.draftProductId ?? null) as string | null;

//         if (!key) return false;

//         return (receivedByKey.get(key) ?? 0) >= Number(item.quantity);
//       });

//       await tx.purchaseOrder.update({
//         where: { id: goodsReceipt.poId },
//         data: { status: fully ? "RECEIVED" : "PARTIALLY_RECEIVED" },
//       });
//     });

//     return res.json({ ok: true });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Error posting goods receipt." });
//   }
// };

// export const postGoodsReceipt = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;

//     const goodsReceipt = await prisma.goodsReceipt.findUnique({
//       where: { id },
//       include: { lines: true, po: { include: { items: true } } },
//     });
//     if (!goodsReceipt) return res.status(404).json({ message: "Goods receipt not found." });
//     if (goodsReceipt.status === "POSTED") return res.json({ ok: true });

//     await prisma.$transaction(async (tx) => {
//       // 1) increment stock + ledger
//       for (const line of goodsReceipt.lines) {
//         await tx.products.update({
//           where: { productId: line.productId },
//           data: { stockQuantity: { increment: line.receivedQty } },
//         });
//         await tx.stockLedger.create({
//           data: {
//             productId: line.productId,
//             sourceType: "GRN",
//             SourceId: goodsReceipt.id,
//             qtyChange: line.receivedQty,
//             memo: `Posted ${goodsReceipt.grnNumber}`,
//           },
//         });
//       }

//       // 2) mark GRN POSTED
//       await tx.goodsReceipt.update({
//         where: { id: goodsReceipt.id },
//         data: { status: GRNStatus.POSTED },
//       });

//       // 3) update PO status
//       const posted = await tx.goodsReceipt.findMany({
//         where: { poId: goodsReceipt.poId, status: GRNStatus.POSTED },
//         include: { lines: true },
//       });

//       const receivedByProduct = new Map<string, number>();
//       for (const g of posted) {
//         for (const ln of g.lines) {
//           receivedByProduct.set(
//             ln.productId,
//             (receivedByProduct.get(ln.productId) ?? 0) + ln.receivedQty
//           );
//         }
//       }

//       const allOrdered = goodsReceipt.po.items;
//       const fully = allOrdered.every(
//         (item) => (receivedByProduct.get(item.productId) ?? 0) >= item.quantity
//       );

//       await tx.purchaseOrder.update({
//         where: { id: goodsReceipt.poId },
//         data: { status: fully ? "RECEIVED" : "PARTIALLY_RECEIVED" },
//       });
//     });

//     return res.json({ ok: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error posting goods receipt." });
//   }
// };
