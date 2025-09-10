import { Request, Response } from "express";
import { GRNStatus, PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();

const toGRNDTO = (g: any) => ({
  id: g.id,
  grnNumber: g.grnNumber,
  poId: g.poId,
  invoiceId: g.invoiceId ?? undefined,
  date: g.date instanceof Date ? g.date.toISOString() : g.date,
  status: g.status as GRNStatus,
  lines: (g.lines ?? []).map((ln: any) => ({
    productId: ln.productId,
    sku: undefined,
    name: ln.product?.name ?? "",          // optional: include product name if you want
    unit: ln.unit ?? "",
    receivedQty: Number(ln.receivedQty),
    unitPrice: ln.unitPrice == null ? undefined : Number(ln.unitPrice),
  })),
});

export const listGoodsReceipts = async (req: Request, res: Response) => {
  try {
    const { q } = req.query as { q?: string };
    const where: Prisma.GoodsReceiptWhereInput | undefined =
      q ? { grnNumber: { contains: q, mode: "insensitive" } } : undefined;

    const rows = await prisma.goodsReceipt.findMany({
      where,
      include: { po: true, invoice: true, lines: { include: { product: true } } },
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
        status: GRNStatus.DRAFT, // create as DRAFT; you POST it later
        lines: {
          create: lines.map((line: any) => ({
            // ✅ checked create: connect the product relation
            product: { connect: { productId: String(line.productId) } },
            unit: String(line.unit ?? line.uom ?? ""),
            receivedQty: Number(line.receivedQty ?? 0),
            // ✅ never null; schema is NOT NULL
            unitPrice: Number(line.unitPrice ?? 0),
          })),
        },
      },
      include: { lines: { include: { product: true } } },
    });

    return res.status(201).json(toGRNDTO(created));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error creating goods receipt." });
  }
};

export const postGoodsReceipt = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const goodsReceipt = await prisma.goodsReceipt.findUnique({
      where: { id },
      include: { lines: true, po: { include: { items: true } } },
    });
    if (!goodsReceipt) return res.status(404).json({ message: "Goods receipt not found." });
    if (goodsReceipt.status === "POSTED") return res.json({ ok: true });

    await prisma.$transaction(async (tx) => {
      // 1) increment stock + ledger
      for (const line of goodsReceipt.lines) {
        await tx.products.update({
          where: { productId: line.productId },
          data: { stockQuantity: { increment: line.receivedQty } },
        });
        await tx.stockLedger.create({
          data: {
            productId: line.productId,
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

      // 3) update PO status
      const posted = await tx.goodsReceipt.findMany({
        where: { poId: goodsReceipt.poId, status: GRNStatus.POSTED },
        include: { lines: true },
      });

      const receivedByProduct = new Map<string, number>();
      for (const g of posted) {
        for (const ln of g.lines) {
          receivedByProduct.set(
            ln.productId,
            (receivedByProduct.get(ln.productId) ?? 0) + ln.receivedQty
          );
        }
      }

      const allOrdered = goodsReceipt.po.items;
      const fully = allOrdered.every(
        (item) => (receivedByProduct.get(item.productId) ?? 0) >= item.quantity
      );

      await tx.purchaseOrder.update({
        where: { id: goodsReceipt.poId },
        data: { status: fully ? "RECEIVED" : "PARTIALLY_RECEIVED" },
      });
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error posting goods receipt." });
  }
};
