import { Request, Response } from "express";
import { GRNStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { yyyymmdd, pad4 } from "../utils/grnNumerGeneration"; 

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
    productDraftId: ln.productDraftId,
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
          invoiceItem: true
        },
      },
      po: { include: { items: true, supplier: true}},
      invoice: { include: { items: true, supplier: true } }
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
    const { poId, invoiceId, date, lines = [] } = req.body;

    if (!poId || !invoiceId || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({
        message: "Purchase order ID, invoice ID and line items are required",
      });
    }

    const grnDate = date ? new Date(date) : new Date();
    if (isNaN(grnDate.getTime())) {
      return res.status(400).json({ message: "Invalid date." });
    }

    const created = await prisma.$transaction(async (tx) => {
      // 1) Validate invoice + belongs to PO + no GRN attached
      const invoice = await tx.supplierInvoice.findUnique({
        where: { id: invoiceId },
        select: { id: true, poId: true, goodsReceipt: { select: { id: true } } },
      });

      if (!invoice) throw Object.assign(new Error("invoice not found."), { status: 404 });
      if (invoice.poId !== poId) {
        throw Object.assign(new Error("Invoice does not belong to this purchase order"), { status: 400 });
      }
      if (invoice.goodsReceipt?.id) {
        throw Object.assign(new Error("This invoice already has a goods receipt."), { status: 400 });
      }

      // 2) invoiceItemId is REQUIRED for each line (for pricing)
      const invoiceItemIds = lines
        .map((l: any) => (typeof l.invoiceItemId === "string" ? l.invoiceItemId.trim() : ""))
        .filter(Boolean);

      if (invoiceItemIds.length !== lines.length) {
        throw Object.assign(new Error("Each GRN line must include invoiceItemId."), { status: 400 });
      }

      // 3) Validate invoiceItemIds belong to this invoice and load unitPrice/qty + mapping fields
      const invItems = await tx.supplierInvoiceItem.findMany({
        where: { id: { in: invoiceItemIds }, invoiceId },
        select: { id: true, unitPrice: true, quantity: true, poItemId: true, draftProductId: true },
      });

      if (invItems.length !== invoiceItemIds.length) {
        throw Object.assign(
          new Error("One or more invoiceItemId values do not belong to this invoice."),
          { status: 400 }
        );
      }

      const invMap = new Map(invItems.map((i) => [i.id, i]));

      // 4) Validate PO item ids (if provided)
      const poItemIds = lines
        .map((l: any) => (typeof l.poItemId === "string" ? l.poItemId.trim() : ""))
        .filter(Boolean);

      if (poItemIds.length) {
        const count = await tx.purchaseOrderItem.count({
          where: { id: { in: poItemIds }, poId },
        });

        if (count !== poItemIds.length) {
          throw Object.assign(
            new Error("One or more Purchase order items IDs does not belong to this purchase order."),
            { status: 400 }
          );
        }
      }

      // 5) Validate DraftProduct ids (and keep consistent with invoice line)
      const draftIds = lines
        .map((l: any) => {
          const v = l.productDraftId ?? l.draftProductId;
          return typeof v === "string" ? v.trim() : "";
        })
        .filter(Boolean);

      const draftCount = await tx.draftProduct.count({
        where: { id: { in: draftIds } },
      });

      if (draftCount !== draftIds.length) {
        throw Object.assign(new Error("One or more DraftProduct IDs are invalid."), { status: 400 });
      }

      // 6) Optional strong consistency checks (recommended)
      for (const line of lines) {
        const invoiceItemId = String(line.invoiceItemId).trim();
        const inv = invMap.get(invoiceItemId)!;

        if (line.poItemId && inv.poItemId && String(line.poItemId).trim() !== inv.poItemId) {
          throw Object.assign(new Error(`GRN line poItemId does not match invoice line (${invoiceItemId}).`), {
            status: 400,
          });
        }

        const draftId = String(line.productDraftId ?? line.draftProductId).trim();
        if (inv.draftProductId && draftId !== inv.draftProductId) {
          throw Object.assign(new Error(`GRN line draft product does not match invoice line (${invoiceItemId}).`), {
            status: 400,
          });
        }

        const rq = Number(line.receivedQty ?? 0);
        if (!Number.isFinite(rq) || rq < 0) {
          throw Object.assign(new Error("receivedQty must be a non-negative number"), { status: 400 });
        }
      }

      // 7) Generate unique GRN number (your existing logic)
      const dateKey = yyyymmdd(grnDate);

      const counter = await tx.grnCounter.upsert({
        where: { dateKey },
        create: { dateKey, next: 2 },
        update: { next: { increment: 1 } },
      });

      const issued = counter.next - 1;
      const grnNumber = `GRN-${dateKey}-${pad4(issued)}`;

      // 8) Create GRN + lines (IMPORTANT: unitPrice comes from invoice line)
      return tx.goodsReceipt.create({
        data: {
          grnNumber,
          poId,
          invoiceId,
          date: grnDate,
          status: GRNStatus.DRAFT,
          lines: {
            create: lines.map((line: any) => {
              const invoiceItemId = String(line.invoiceItemId).trim();
              const inv = invMap.get(invoiceItemId)!;

              return {
                invoiceItemId,
                poItemId: line.poItemId ? String(line.poItemId).trim() : inv.poItemId ?? null,
                productDraftId: String(line.productDraftId ?? line.draftProductId).trim(),
                unit: String(line.unit ?? line.uom ?? ""),
                receivedQty: Number(line.receivedQty ?? 0),

                // ✅ always from invoice item:
                unitPrice: Number(inv.unitPrice),
              };
            }),
          },
        },
        include: {
          po: true,
          invoice: true,
          lines: { include: { product: true, invoiceItem: true } },
        },
      });
    });

    return res.status(201).json(toGRNDTO(created));
  } catch (error: any) {
    const status = error?.status ?? 500;
    const message = error?.message ?? "Error creating goods receipt.";
    console.error("createGoodsReceipt error:", error);

    if (error?.code === "P2002") {
      return res.status(409).json({ message: "Duplicate GRN (unique constraint).", meta: error.meta });
    }

    return res.status(status).json({ message });
  }
};


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

    //Guard if the goods receipt doesn't exist 
    if (!goodsReceipt) {
      return res.status(404).json({ 
        message: "Goods receipt not found.",
        ok: false 
      });
    }

    if (goodsReceipt.status === GRNStatus.POSTED) {
      return res.json({ 
        ok: true, 
        grnId: goodsReceipt.id, 
        poId: goodsReceipt.poId,
        message: "Goods receipt already posted" 
      });
    }

    // Validation checks
    const missingPoItemId = goodsReceipt.lines.some((ln) => !ln.poItemId);
    if (missingPoItemId) {
      return res.status(400).json({
        message: "Cannot POST this GRN because one or more lines are missing poItemId.",
        ok: false,
      });
    }

    const missingDraft = goodsReceipt.lines.some((ln) => !ln.productDraftId);
    if (missingDraft) {
      return res.status(400).json({
        message: "Cannot POST this GRN because one or more lines are missing productDraftId.",
        ok: false,
      });
    }

    await prisma.$transaction(async (tx) => {
      // 1) Mark GRN as POSTED
      await tx.goodsReceipt.update({
        where: { id: goodsReceipt.id },
        data: { status: GRNStatus.POSTED },
      });

      // 2) Recompute PO status
      const posted = await tx.goodsReceipt.findMany({
        where: { poId: goodsReceipt.poId, status: GRNStatus.POSTED },
        include: { lines: true },
      });

      for (const line of goodsReceipt.lines) {
    // If this GRN line has a promoted productId, sync it to the invoice
    if (line.productId && line.poItemId) {
      await tx.supplierInvoiceItem.updateMany({
        where: {
          poItemId: line.poItemId,
          productId: null, // Only update if not already linked
        },
        data: {
          productId: line.productId,
        },
      });
    }
  }

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
      
      if (!goodsReceipt.po) {
        throw new Error("This goods receipt is not attach to any purchase order.")
      }

      const fullyReceived = goodsReceipt.po.items.every((item) => {
        const received = receivedByPoItemId.get(item.id) ?? 0;
        return received >= Number(item.quantity);
      });

      if (!goodsReceipt.poId) {
        throw new Error("This goods receipt does not have a purchase order id")
      }

      await tx.purchaseOrder.update({
        where: { id: goodsReceipt.poId },
        data: { status: fullyReceived ? "RECEIVED" : "PARTIALLY_RECEIVED" },
      });
    });

    return res.json({ 
      ok: true, 
      grnId: goodsReceipt.id, 
      poId: goodsReceipt.poId,
      message: "Goods receipt posted successfully"
    });
  } catch (error) {
    console.error("Post GRN error:", error);
    return res.status(500).json({ 
      message: "Error posting goods receipt.",
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const updateGoodsReceipt = async (req: Request, res: Response) => {
  const grnId = String(req.params.id || "").trim();
  if (!grnId) return res.status(400).json({ message: "GRN id is required." });

  try {
    const { date, lines = [] } = req.body as {
      date?: string;
      lines?: Array<{
        invoiceItemId?: string;
        poItemId?: string;
        productDraftId: string;
        unit?: string | null;
        receivedQty: number;
        unitPrice: number;
      }>;
    };

    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ message: "Non-empty lines are required." });
    }

    const existing = await prisma.goodsReceipt.findUnique({
      where: { id: grnId },
      select: { id: true, status: true, poId: true, invoiceId: true },
    });

    if (!existing) return res.status(404).json({ message: "GRN not found." });

    if (existing.status === GRNStatus.POSTED) {
      return res.status(400).json({
        message: "Cannot edit a POSTED GRN. Void/reverse it instead.",
      });
    }

    // validate line ids (draftProductId required)
    const bad = lines.find((l) => !l.productDraftId || !String(l.productDraftId).trim());
    if (bad) {
      return res.status(400).json({ message: "Each line must have productDraftId." });
    }

    // validate draft products exist
    const draftIds = [...new Set(lines.map((l) => String(l.productDraftId).trim()))];
    const foundDrafts = await prisma.draftProduct.count({ where: { id: { in: draftIds } } });
    if (foundDrafts !== draftIds.length) {
      return res.status(400).json({ message: "One or more productDraftId values are invalid." });
    }

    // validate PO items belong to this PO (if provided)
    const poItemIds = lines
      .map((l) => (l.poItemId ? String(l.poItemId).trim() : ""))
      .filter(Boolean);

    if (poItemIds.length && existing.poId) {
      const count = await prisma.purchaseOrderItem.count({
        where: { id: { in: poItemIds }, poId: existing.poId },
      });
      if (count !== poItemIds.length) {
        return res.status(400).json({ message: "One or more poItemId do not belong to this PO." });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // replace lines
      await tx.goodsReceiptItem.deleteMany({ where: { grnId } });

      const grn = await tx.goodsReceipt.update({
        where: { id: grnId },
        data: {
          date: date ? new Date(date) : undefined,
          lines: {
            create: lines.map((l) => ({
              invoiceItemId: l.invoiceItemId ? String(l.invoiceItemId).trim() : null,
              poItemId: l.poItemId ? String(l.poItemId).trim() : null,
              productDraftId: String(l.productDraftId).trim(),
              unit: l.unit ?? null,
              receivedQty: Number(l.receivedQty ?? 0),
              unitPrice: Number(l.unitPrice ?? 0),
            })),
          },
        },
        include: {
          po: true,
          invoice: true,
          lines: { include: { product: true } },
        },
      });

      return grn;
    });

    return res.status(200).json(toGRNDTO(updated));
  } catch (error: any) {
    console.error("updateGoodsReceipt error:", error);

    if (error?.code === "P2025") return res.status(404).json({ message: "GRN not found." });
    return res.status(500).json({ message: "Error updating goods receipt.", debug: error?.message });
  }
};

export const deleteGoodsReceipt = async (req: Request, res: Response) => {
  const grnId = String(req.params.id || "").trim();

  if (!grnId) {
    return res.status(400).json({ message: "GRN ID is required" });
  }

  try {
    const existing = await prisma.goodsReceipt.findUnique({
      where: { id: grnId },
      select: { id: true, status: true },
    });

    if (!existing) {
      return res.status(404).json({ message: "Goods receipt not found." });
    }

    // ✅ Cannot delete posted GRN (stock + ledger impact)
    if (existing.status === GRNStatus.POSTED) {
      return res.status(400).json({
        message: "Cannot delete a POSTED goods receipt. Void/reverse it instead.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Count lines before delete (since delete cascades)
      const linesCount = await tx.goodsReceiptItem.count({
        where: { grnId },
      });

      // Delete GRN (cascades to lines)
      await tx.goodsReceipt.delete({
        where: { id: grnId },
      });

      return {
        grnId,
        deletedLinesCount: linesCount,
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
      error: error?.message,
    });
  }
};




