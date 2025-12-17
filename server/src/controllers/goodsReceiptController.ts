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
    draftProductId: ln.productDraftId,
    //sku: ln.product?.sku ?? undefinedd
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

export const createGoodsReceipt = async (req: Request, res: Response) => {
  try {
    const { grnNumber, poId, invoiceId, date, lines = [] } = req.body;

    if (!poId || !Array.isArray(lines) || lines.length === 0) {
      return res
        .status(400)
        .json({ error: "Purchase order ID and line items are required" });
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
            //product: { connect: { id: String(line.productDraftId) } },
            productDraftId: line.draftProductId,
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

// postGoodsReceipt unchanged




export const postGoodsReceipt = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const goodsReceipt = await prisma.goodsReceipt.findUnique({
      where: { id },
      include: {
        lines: true,
        po: { include: { items: true } },
      },
    });

    if (!goodsReceipt) {
      return res.status(404).json({ message: "Goods receipt not found." });
    }

    if (goodsReceipt.status === "POSTED") {
      return res.json({ ok: true });
    }

    // ✅ RULE: you cannot POST to inventory if any line has no real productId
    const hasAnyDraftLines = goodsReceipt.lines.some((ln) => !ln.productId);
    if (hasAnyDraftLines) {
      return res.status(400).json({
        message:
          "Cannot POST this GRN because one or more lines are not linked to a real product yet.",
      });
    }

    await prisma.$transaction(async (tx) => {
      // 1) increment stock + ledger (safe now because productId is guaranteed)
      for (const line of goodsReceipt.lines) {
        // productId must exist because we blocked earlier
        const pid = line.productId as string;

        await tx.products.update({
          where: { productId: pid },
          data: { stockQuantity: { increment: line.receivedQty } },
        });

        await tx.stockLedger.create({
          data: {
            productId: pid,
            sourceType: "GRN",
            SourceId: goodsReceipt.id,
            qtyChange: line.receivedQty,
            memo: `Posted ${goodsReceipt.grnNumber}`,
          },
        });
      }

      // 2) mark GRN POSTED
      await tx.goodsReceipt.update({
        where: { id: goodsReceipt.id },
        data: { status: GRNStatus.POSTED },
      });

      // 3) update PO status based on all posted GRNs for that PO
      const posted = await tx.goodsReceipt.findMany({
        where: { poId: goodsReceipt.poId, status: GRNStatus.POSTED },
        include: { lines: true },
      });

      // ✅ IMPORTANT: match by "key" (productId OR draftProductId)
      // If your GRN lines don't have draftProductId, then just productId is used.
      const receivedByKey = new Map<string, number>();

      for (const g of posted) {
        for (const ln of g.lines) {
          const key =
            (ln.productId ?? (ln as any).draftProductId ?? null) as string | null;

          if (!key) continue;

          receivedByKey.set(
            key,
            (receivedByKey.get(key) ?? 0) + Number(ln.receivedQty)
          );
        }
      }

      const allOrdered = goodsReceipt.po.items;

      const fully = allOrdered.every((item: any) => {
        const key =
          (item.productId ?? item.draftProductId ?? null) as string | null;

        if (!key) return false;

        return (receivedByKey.get(key) ?? 0) >= Number(item.quantity);
      });

      await tx.purchaseOrder.update({
        where: { id: goodsReceipt.poId },
        data: { status: fully ? "RECEIVED" : "PARTIALLY_RECEIVED" },
      });
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error posting goods receipt." });
  }
};

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
