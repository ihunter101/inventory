import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";



// ─── helpers ────────────────────────────────────────────────────────────────

function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
  return value ? Number(value) : 0;
}

/**
 * BUG FIX: original code was missing parentheses around the subtraction.
 *   Wrong:  end.getTime() - start.getTime() / msPerDay
 *   Fixed:  (end.getTime() - start.getTime()) / msPerDay
 */
function daysBetween(start: Date, end: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
}

// ─── main analytics query ───────────────────────────────────────────────────

export async function getSupplierAnalytics(supplierId: string) {
  const supplier = await prisma.supplier.findUnique({
    where: { supplierId },
    select: {
      supplierId: true,
      name: true,
      email: true,
      phone: true,
      address: true,
    },
  });

  if (!supplier) throw new Error("Supplier not found");

  // 1. Invoice totals (exclude VOID)
  const invoiceAggregate = await prisma.supplierInvoice.aggregate({
    where: { supplierId, status: { not: "VOID" } },
    _sum: { amount: true, balanceRemaining: true },
    _count: { id: true },
  });

  const totalInvoiceAmount = decimalToNumber(invoiceAggregate._sum.amount);
  const totalInvoices = invoiceAggregate._count.id;

  // 2. Payments (POSTED only)
  const paymentAggregate = await prisma.invoicePayment.aggregate({
    where: { status: "POSTED", invoice: { supplierId } },
    _sum: { amount: true },
    _count: { id: true },
  });

  const totalPaid = decimalToNumber(paymentAggregate._sum.amount);
  const totalPayments = paymentAggregate._count.id;

  // 3. Amount owed
  const balanceRemainingFromInvoices = decimalToNumber(
    invoiceAggregate._sum.balanceRemaining
  );
  const totalOwed =
    balanceRemainingFromInvoices > 0
      ? balanceRemainingFromInvoices
      : Math.max(totalInvoiceAmount - totalPaid, 0);

  // 4. Purchase order totals
  const poAggregate = await prisma.purchaseOrder.aggregate({
    where: { supplierId },
    _sum: { total: true },
    _count: { id: true },
  });

  const totalPurchaseOrderAmount = decimalToNumber(poAggregate._sum.total);
  const totalPurchaseOrders = poAggregate._count.id;

  // 5. Delivery time (PO orderDate → first GRN date)
  const purchaseOrdersWithGrns = await prisma.purchaseOrder.findMany({
    where: {
      supplierId,
      grns: { some: { date: { not: undefined } } },
    },
    select: {
      orderDate: true,
      grns: {
        select: { date: true },
        orderBy: { date: "asc" },
      },
    },
  });

  const deliveryDays: number[] = [];

  for (const po of purchaseOrdersWithGrns) {
    for (const grn of po.grns) {
      const days = daysBetween(po.orderDate, grn.date);
      if (days >= 0) deliveryDays.push(days);
    }
  }

  const averageDeliveryDays =
    deliveryDays.length > 0
      ? Math.round(deliveryDays.reduce((s, d) => s + d, 0) / deliveryDays.length)
      : null;

  const fastestDeliveryDays =
    deliveryDays.length > 0 ? Math.min(...deliveryDays) : null;
  const slowestDeliveryDays =
    deliveryDays.length > 0 ? Math.max(...deliveryDays) : null;

  // 6. Invoice status breakdown
  const invoiceStatusBreakdown = await prisma.supplierInvoice.groupBy({
    by: ["status"],
    where: { supplierId },
    _count: { id: true },
    _sum: { amount: true },
  });

  // 7. Overdue invoices (due date in the past, unpaid-ish)
  const overdueInvoices = await prisma.supplierInvoice.findMany({
    where: {
      supplierId,
      dueDate: { lt: new Date() },
      status: { in: ["PENDING", "READY_TO_PAY", "PARTIALLY_PAID", "OVERDUE"] },
    },
    select: {
      id: true,
      invoiceNumber: true,
      amount: true,
      balanceRemaining: true,
      date: true,
      dueDate: true,
      status: true,
    },
    orderBy: { dueDate: "asc" },
    take: 10,
  });

  // 8. Recent invoices with payment detail
  const recentInvoices = await prisma.supplierInvoice.findMany({
    where: { supplierId },
    select: {
      id: true,
      invoiceNumber: true,
      amount: true,
      balanceRemaining: true,
      status: true,
      date: true,
      dueDate: true,
      payments: {
        where: { status: "POSTED" },
        select: { amount: true },
      },
    },
    orderBy: { date: "desc" },
    take: 10,
  });

  // 9. Payment rate
  const paymentRate =
    totalInvoiceAmount > 0
      ? Math.round((totalPaid / totalInvoiceAmount) * 100)
      : 0;

  return {
    supplier,

    kpis: {
      totalInvoiceAmount,
      totalPaid,
      totalOwed,
      totalPurchaseOrderAmount,
      totalPurchaseOrders,
      totalInvoices,
      totalPayments,
      paymentRate,
      averageDeliveryDays,
      fastestDeliveryDays,
      slowestDeliveryDays,
      overdueInvoiceCount: overdueInvoices.length,
    },

    invoiceStatusBreakdown: invoiceStatusBreakdown.map((row) => ({
      status: row.status,
      count: row._count.id,
      totalAmount: decimalToNumber(row._sum.amount),
    })),

    overdueInvoices: overdueInvoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      amount: Number(inv.amount),
      balanceRemaining:
        inv.balanceRemaining !== null
          ? Number(inv.balanceRemaining)
          : Number(inv.amount),
      date: inv.date,
      dueDate: inv.dueDate,
      status: inv.status,
    })),

    recentInvoices: recentInvoices.map((inv) => {
      const paidAmount = inv.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const invoiceAmount = Number(inv.amount);
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: invoiceAmount,
        paidAmount,
        balanceRemaining:
          inv.balanceRemaining !== null
            ? Number(inv.balanceRemaining)
            : Math.max(invoiceAmount - paidAmount, 0),
        status: inv.status,
        date: inv.date,
        dueDate: inv.dueDate,
      };
    }),
  };
}