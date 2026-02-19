import { Request, Response } from "express";
import { prisma } from '../lib/prisma'; // adjust import
import buildMatchRows from "../lib/match"; // server-side version (same logic)
import { MatchStatus } from "@prisma/client";

export const createMatch = async (req: Request, res: Response) => {
  try {
    const { poId, invoiceId, grnId } = req.body ?? {};
    if (!poId || !invoiceId || !grnId) {
      return res.status(400).json({ message: "poId, invoiceId, grnId are required." });
    }

    // Load full PO/Invoice/GRN
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { items: { include: { product: true } } },
    });
    const invoice = await prisma.supplierInvoice.findUnique({
      where: { id: invoiceId },
      include: { items: { include: { draftProduct: true, product: true } } },
    });
    const grn = await prisma.goodsReceipt.findUnique({
      where: { id: grnId },
      include: { lines: true },
    });

    if (!po || !invoice || !grn) {
      return res.status(404).json({ message: "PO/Invoice/GRN not found." });
    }

    const rows = buildMatchRows(po as any, invoice as any, grn as any);

    const payableTotal = rows.reduce((s, r) => s + (r.payableAmount ?? 0), 0);

    // Prevent duplicates via unique index
    const created = await prisma.threeWayMatch.create({
      data: {
        poId,
        invoiceId,
        grnId,
        status: grn.status === "POSTED" && rows.every(r => r.lineOk) ? MatchStatus.READY_TO_PAY : MatchStatus.DRAFT,
        payableTotal: payableTotal,
        lines: {
          create: rows.map((r) => ({
            poItemId: r.poItemId,
            invoiceItemId: r.invoiceItemId,
            grnLineId: r.grnLineId,
            unit: r.unit,
            poQty: r.poQty,
            grnQty: r.grnQty,
            invUnitPrice: r.invUnitPrice ?? null,
            payableQty: r.payableQty,
            payableAmount: r.payableAmount,
            notes: r.notes ?? null,
          })),
        },
      },
      include: { lines: true },
    });

    return res.status(201).json(created);
  } catch (e: any) {
    console.error("createMatch error:", e);

    if (e?.code === "P2002") {
      return res.status(409).json({ message: "Match already exists for this PO + invoice + GRN." });
    }

    return res.status(500).json({ message: "Failed to create match.", debug: e?.message });
  }
};

export const getMatchById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ message: "id is required." });

    const match = await prisma.threeWayMatch.findUnique({
      where: { id },
      include: { lines: true },
    });

    if (!match) return res.status(404).json({ message: "Match not found." });
    return res.json(match);
  } catch (e: any) {
    console.error("getMatchById error:", e);
    return res.status(500).json({ message: "Failed to fetch match.", debug: e?.message });
  }
};

export const getMatch = async (req: Request, res: Response) => {
  try {
    const poId = typeof req.query.poId === "string" ? req.query.poId : undefined;
    const invoiceId  = typeof req.query.invoiceId === "string" ? req.query.invoiceId : undefined;
    const grnId = typeof req.query.grnId === "string" ? req.query.grnId  : undefined;

    if (!poId || !invoiceId || !grnId) {
      return res.status(400).json({ message: "poId, invoiceId, grnId are required." });
    }

    const matches = await prisma.threeWayMatch.findMany({
      where: {
        ...(poId ? { poId } : {}),
        ...(invoiceId ? { invoiceId } : {}),
        ...(grnId ? { grnId } : {}),
      },
      include: { lines: true },
      orderBy: { createdAt: "desc" },
    });

    if (matches.length === 0) return res.status(404).json({ message: "Match not found." });
    return res.json(matches);
  } catch (e: any) {
    console.error("getMatchById error:", e);
    return res.status(500).json({ message: "Failed to fetch match.", debug: e?.message });
  }
}

export const getPoPaymentsSummary = async (req: Request, res: Response) => {
  try {
    const { poId } = req.params;

    const payableAgg = await prisma.matchLine.aggregate({
      _sum: { payableAmount: true },
      where: {
        match: {
          poId,
          status: { in: ["READY_TO_PAY", "PAID"] },
        },
      },
    })

    //2.) Total paid (from payments)
    // if you denormalized poId on payment, this is fast

    const paidAggs = await prisma.invoicePayment.aggregate({
      _sum: { amount: true },
      where:  { poId, status: "POSTED"},
    });

    const totalPayable = payableAgg._sum.payableAmount ?? 0
    const totalPaid = paidAggs._sum.amount ?? 0;

    return res.json({
      poId,
      totalPayable,
      totalPaid,
      outstanding: Number(totalPayable) - Number(totalPaid),
    });
  } catch (error: any) {
    console.error("getPoSummary errro:", error);
    return res.status(500).json({ message: "Error getting PO summary", debug: error.message }) 
  }
}

export const getAllPoPaymentSummary = async (req: Request, res: Response) => {
  try {
    const payableAggs = await prisma.matchLine.aggregate({
      _sum: { payableAmount: true },
      where: {
        match: {
          status: { in: ["READY_TO_PAY", "PAID"] }
        },
      },
    })

    const paidAggs = await prisma.invoicePayment.aggregate({
      _sum: { amount: true },
      where: { status: "POSTED" },
    })

    const totalPayable = Number(payableAggs._sum.payableAmount ?? 0)
    const totalPaid = Number(paidAggs._sum.amount ?? 0)

    return res.json({
      totalPayable,
      totalPaid,
      outstanding: totalPayable - totalPaid
    })
  } catch (e: any) {
    console.error("getAllPoPaymentSummary error:", e);
    return res.status(500).json({ message: "Failed to fetch PO payment summary.", debug: e?.message })
  }
}

const toNumber = (v: any) => (v == null ? 0 : Number(v));

export const buildMatch = async (req: Request, res: Response) => {
  try {
    const { poId, invoiceId, grnId } = req.body;

    if (!poId || !invoiceId || !grnId) {
      return res.status(400).json({ message: "poId, invoiceId, grnId are required." });
    }

    const match = await prisma.$transaction(async (tx) => {
      // 1) Load invoice + items
      const invoice = await tx.supplierInvoice.findUnique({
        where: { id: invoiceId },
        include: {
          items: true, // includes quantity, unitPrice, poItemId, draftProductId
          goodsReceipt: { select: { id: true } },
        },
      });
      if (!invoice) throw Object.assign(new Error("Invoice not found."), { status: 404 });

      if (invoice.poId !== poId) {
        throw Object.assign(new Error("Invoice does not belong to this PO."), { status: 400 });
      }

      // 2) Load GRN + lines
      const grn = await tx.goodsReceipt.findUnique({
        where: { id: grnId },
        include: {
          lines: true, // includes invoiceItemId, receivedQty, unitPrice snapshot
        },
      });
      if (!grn) throw Object.assign(new Error("GRN not found."), { status: 404 });

      if (grn.poId !== poId) {
        throw Object.assign(new Error("GRN does not belong to this PO."), { status: 400 });
      }

      // 3) Enforce invoice <-> GRN 1:1 relationship
      if (!grn.invoiceId) {
        throw Object.assign(new Error("GRN must be linked to an invoice."), { status: 400 });
      }
      if (grn.invoiceId !== invoiceId) {
        throw Object.assign(new Error("GRN is not linked to this invoice."), { status: 400 });
      }

      // 4) Enforce line mapping presence
      const missing = grn.lines.filter((l) => !l.invoiceItemId);
      if (missing.length) {
        throw Object.assign(
          new Error("One or more GRN lines are missing invoiceItemId mapping."),
          { status: 400 }
        );
      }

      // 5) Enforce no existing match per invoice/grn (controller-level constraint)
      const existingByInvoice = await tx.threeWayMatch.findFirst({
        where: { invoiceId },
        select: { id: true, status: true },
      });

      if (existingByInvoice && existingByInvoice.status !== "VOID") {
        throw Object.assign(new Error("A match already exists for this invoice."), { status: 409 });
      }

      const existingByGrn = await tx.threeWayMatch.findFirst({
        where: { grnId },
        select: { id: true, status: true },
      });

      if (existingByGrn && existingByGrn.status !== "VOID") {
        throw Object.assign(new Error("A match already exists for this GRN."), { status: 409 });
      }

      // 6) Build invoice item lookup
      const invMap = new Map(invoice.items.map((it) => [it.id, it]));

      // 7) Build MatchLine rows: payable = GRN qty × invoice unit price
      const lineRows = grn.lines.map((gl) => {
        const invoiceItemId = gl.invoiceItemId!;
        const inv = invMap.get(invoiceItemId);

        if (!inv) {
          throw Object.assign(new Error(`GRN line references invoiceItemId not in invoice: ${invoiceItemId}`), {
            status: 400,
          });
        }

        const grnQty = Number(gl.receivedQty ?? 0);
        const invQty = Number(inv.quantity ?? 0);
        const invUnitPrice = inv.unitPrice; // Decimal

        // Policy: cap payment at invoice qty (recommended safe default)
        const payableQty = Math.min(grnQty, invQty);

        // Decimal math: do it via Prisma Decimal by multiplying in JS as number cautiously
        // Better: store invUnitPrice in MatchLine as Decimal and compute payableAmount as Decimal in app layer
        const payableAmount = Number(invUnitPrice) * payableQty;

        return {
          poItemId: inv.poItemId ?? null,
          invoiceItemId,
          grnLineId: gl.id,

          name: inv.description ?? null,
          unit: inv.uom ?? null,

          poQty: inv.poItemId ? 0 : 0, // optional: you can populate later from PO item if desired
          grnQty,
          invUnitPrice: invUnitPrice,

          payableQty,
          payableAmount,
          notes:
            grnQty !== invQty
              ? `Qty mismatch: invoice=${invQty}, received=${grnQty} (paying ${payableQty})`
              : null,
        };
      });

      const payableTotal = lineRows.reduce((sum, r) => sum + Number(r.payableAmount ?? 0), 0);

      // 8) Create match + lines
      const created = await tx.threeWayMatch.create({
        data: {
          poId,
          invoiceId,
          grnId,
          status: "DRAFT",
          payableTotal,
          //currency: invoice?.currency ?? "XCD",
          lines: {
            create: lineRows.map((r) => ({
              poItemId: r.poItemId,
              invoiceItemId: r.invoiceItemId,
              grnLineId: r.grnLineId,
              name: r.name,
              unit: r.unit,
              poQty: r.poQty,
              grnQty: r.grnQty,
              invUnitPrice: r.invUnitPrice,
              payableQty: r.payableQty,
              payableAmount: r.payableAmount,
              notes: r.notes,
            })),
          },
        },
        include: { lines: true },
      });

      return created;
    });

    return res.status(201).json(match);
  } catch (e: any) {
    const status = e?.status ?? 500;
    console.error("buildMatch error:", e);
    return res.status(status).json({ message: e?.message ?? "Failed to build match." });
  }
};

//PATCH /matches/:matchId/status
export const updateMatchStatus = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const { status } = req.body as { status: "DRAFT" | "READY_TO_PAY" | "PAID" | "VOID" };

    if (!status) return res.status(400).json({ message: "status required" });

    const updated = await prisma.threeWayMatch.update({
      where: { id: matchId },
      data: { status },
      include: { lines: true },
    });

    return res.json(updated);
  } catch (e: any) {
    console.error("updateMatchStatus error:", e);
    return res.status(500).json({ message: "Failed to update match status.", debug: e?.message });
  }
};

