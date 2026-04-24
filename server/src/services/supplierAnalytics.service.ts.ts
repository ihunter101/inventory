import { Request, Response } from "express"
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";
//const prisma = new PrismaClient();

export const getSuppliers = async (req: Request, res: Response) => {
   try {
    const suppliers = await prisma.supplier.findMany({
        orderBy: {
            name: "asc"
        }, 
    }) 
    res.json(suppliers)
   } catch (error) {
    res.status(500).json({ message: "Error getting Suppliers "})
   }
}

function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
    return value ? Number(value) : 0
}

function daysBetween(start: Date, end: Date): number {
    const msPerDay = 1000 * 60 * 60 * 24
    return Math.round(end.getTime() - start.getTime() / msPerDay)
}


export async function getSupplierAnalytics(supplierId: string) {
  const supplier = await prisma.supplier.findUnique({
    where: { supplierId },
    select: {
      supplierId: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      createdAt: false,
    },
  });

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  /**
   * 1. Invoice totals
   */
  const invoiceAggregate = await prisma.supplierInvoice.aggregate({
    where: {
      supplierId,
      status: {
        not: "VOID",
      },
    },
    _sum: {
      amount: true,
      balanceRemaining: true,
    },
    _count: {
      id: true,
    },
  });

  const totalInvoiceAmount = decimalToNumber(invoiceAggregate._sum.amount);
  const totalInvoices = invoiceAggregate._count.id;

  /**
   * 2. Payments made to this supplier
   *
   * InvoicePayment does not have supplierId directly,
   * so we filter through the related invoice.
   */
  const paymentAggregate = await prisma.invoicePayment.aggregate({
    where: {
      status: "POSTED",
      invoice: {
        supplierId,
      },
    },
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
  });

  const totalPaid = decimalToNumber(paymentAggregate._sum.amount);
  const totalPayments = paymentAggregate._count.id;

  /**
   * 3. Amount owed
   *
   * If you maintain balanceRemaining correctly, use that.
   * Otherwise, calculate: totalInvoiceAmount - totalPaid.
   */
  const balanceRemainingFromInvoices = decimalToNumber(
    invoiceAggregate._sum.balanceRemaining
  );

  const totalOwed =
    balanceRemainingFromInvoices > 0
      ? balanceRemainingFromInvoices
      : Math.max(totalInvoiceAmount - totalPaid, 0);

  /**
   * 4. Purchase order totals
   */
  const poAggregate = await prisma.purchaseOrder.aggregate({
    where: {
      supplierId,
    },
    _sum: {
      total: true,
    },
    _count: {
      id: true,
    },
  });

  const totalPurchaseOrderAmount = decimalToNumber(poAggregate._sum.total);
  const totalPurchaseOrders = poAggregate._count.id;

  /**
   * 5. Average delivery time
   *
   * Delivery time = GRN date - PO order date.
   *
   * We fetch POs that have at least one GRN with a date.
   */
  const purchaseOrdersWithGrns = await prisma.purchaseOrder.findMany({
    where: {
      supplierId,
      grns: {
        some: {
          date: {
            not: undefined,
          },
        },
      },
    },
    select: {
      id: true,
      poNumber: true,
      orderDate: true,
      grns: {
        select: {
          id: true,
          grnNumber: true,
          date: true,
          status: true,
        },
        orderBy: {
          date: "asc",
        },
      },
    },
  });

  const deliveryDays: number[] = [];

  for (const po of purchaseOrdersWithGrns) {
    for (const grn of po.grns) {
      const days = daysBetween(po.orderDate, grn.date);

      if (days >= 0) {
        deliveryDays.push(days);
      }
    }
  }

  const averageDeliveryDays =
    deliveryDays.length > 0
      ? Math.round(
          deliveryDays.reduce((sum, days) => sum + days, 0) /
            deliveryDays.length
        )
      : null;

  const fastestDeliveryDays =
    deliveryDays.length > 0 ? Math.min(...deliveryDays) : null;

  const slowestDeliveryDays =
    deliveryDays.length > 0 ? Math.max(...deliveryDays) : null;

  /**
   * 6. Invoice status breakdown
   */
  const invoiceStatusBreakdown = await prisma.supplierInvoice.groupBy({
    by: ["status"],
    where: {
      supplierId,
    },
    _count: {
      id: true,
    },
    _sum: {
      amount: true,
    },
  });

  const formattedInvoiceStatusBreakdown = invoiceStatusBreakdown.map((row) => ({
    status: row.status,
    count: row._count.id,
    totalAmount: decimalToNumber(row._sum.amount),
  }));

  /**
   * 7. Overdue invoices
   */
  const overdueInvoices = await prisma.supplierInvoice.findMany({
    where: {
      supplierId,
      dueDate: {
        lt: new Date(),
      },
      status: {
        in: ["PENDING", "READY_TO_PAY", "PARTIALLY_PAID", "OVERDUE"],
      },
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
    orderBy: {
      dueDate: "asc",
    },
    take: 10,
  });

  /**
   * 8. Recent invoices
   */
  const recentInvoices = await prisma.supplierInvoice.findMany({
    where: {
      supplierId,
    },
    select: {
      id: true,
      invoiceNumber: true,
      amount: true,
      balanceRemaining: true,
      status: true,
      date: true,
      dueDate: true,
      payments: {
        select: {
          id: true,
          amount: true,
          paidAt: true,
          method: true,
          status: true,
        },
        orderBy: {
          paidAt: "desc",
        },
      },
    },
    orderBy: {
      date: "desc",
    },
    take: 10,
  });

  const formattedRecentInvoices = recentInvoices.map((invoice) => {
    const paidAmount = invoice.payments
      .filter((payment) => payment.status === "POSTED")
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    const invoiceAmount = Number(invoice.amount);

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoiceAmount,
      paidAmount,
      balanceRemaining:
        invoice.balanceRemaining !== null
          ? Number(invoice.balanceRemaining)
          : Math.max(invoiceAmount - paidAmount, 0),
      status: invoice.status,
      date: invoice.date,
      dueDate: invoice.dueDate,
    };
  });

  /**
   * 9. Payment performance
   */
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

    invoiceStatusBreakdown: formattedInvoiceStatusBreakdown,

    overdueInvoices: overdueInvoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: Number(invoice.amount),
      balanceRemaining:
        invoice.balanceRemaining !== null
          ? Number(invoice.balanceRemaining)
          : Number(invoice.amount),
      date: invoice.date,
      dueDate: invoice.dueDate,
      status: invoice.status,
    })),

    recentInvoices: formattedRecentInvoices,
  };
}