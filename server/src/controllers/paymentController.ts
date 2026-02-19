import { Request, Response } from "express"
import { prisma }  from "../lib/prisma"
import { InvoiceStatus } from "@prisma/client";

export const createInvoicePayment = async (req: Request, res: Response) => {
  try {
    const invoiceId = req.params.id;
    const { amount, paidAt, method, reference, currency } = req.body;

    if (!invoiceId) {
      return res.status(400).json({ message: "invoiceId is required." });
    }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0." });
    }

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.supplierInvoice.findUnique({
        where: { id: invoiceId },
        select: { id: true, poId: true, amount: true, balanceRemaining: true },
      });

      if (!invoice) {
        throw Object.assign(new Error("Invoice not found."), { statusCode: 404 });
      }

      const payment = await tx.invoicePayment.create({
        data: {
          invoiceId,
          poId: invoice.poId ?? null,
          amount: amt,
          currency: currency ?? "XCD",
          paidAt: paidAt ? new Date(paidAt) : undefined,
          method,
          reference,
          status: "POSTED",
        },
      });

      const paidAgg = await tx.invoicePayment.aggregate({
        where: { invoiceId, status: "POSTED" },
        _sum: { amount: true },
      });

      const totalPaid = Number(paidAgg._sum.amount ?? 0);
      const invoiceTotal = Number(invoice.amount ?? 0);

      const newStatus: InvoiceStatus = totalPaid >= invoiceTotal ? "PAID" : "PARTIALLY_PAID";
      const newBalance = Math.max(0, invoiceTotal - totalPaid);

      await tx.supplierInvoice.update({
        where: { id: invoiceId },
        data: { status: newStatus, balanceRemaining: newBalance },
      });

      return { payment, newStatus, newBalance };
    });

    return res.status(201).json(result);
  } catch (error: any) {
    const statusCode = error?.statusCode ?? 500;
    console.error("createInvoicePayment error:", error);
    return res.status(statusCode).json({ message: error?.message ?? "Error creating invoice payment." });
  }
};


export const getInvoicePayments = async (req: Request, res: Response) => {
  try {
    const { id: invoiceId } = req.params;
    
    const payments = await prisma.invoicePayment.findMany({
      where: { invoiceId, status: "POSTED" },
      orderBy: { paidAt: "desc" },
    });

    return res.json(payments)

  } catch (error: any) {
    console.error("getInvoicePayments error:", error);
    return res.status(500).json({ message: "Error retrieving invoice payments.", debug: error?.message });
  }
}

export const getInvoicePaymentSummary = async (req: Request, res: Response) => {
  try {
    const { id: invoiceId } = req.params;

    const match = await prisma.threeWayMatch.findFirst({
      where: { invoiceId, status: { not: "VOID" } },
      select: { payableTotal: true, status: true, id: true },
      orderBy: { createdAt: "desc"}
    })

    const paidAgg = await prisma.invoicePayment.aggregate({
      _sum: { amount: true },
      where: { invoiceId, status: "POSTED"}
    });

    const payableTotal = Number(match?.payableTotal ?? 0);
    const paidTotal = Number(paidAgg._sum.amount ?? 0)

    return res.json({
      invoiceId,
      payableTotal,
      paidTotal,
      outstanding: payableTotal - paidTotal,
      matchStatus: match?.status ?? null,
    })
  } catch (e: any) {
    console.error("getInvoicePaymentSummary error: ", e);
    return res.status(500).json({ message: "Failed to fetch the invoice summary.", debug: e?.message})
  }
}

