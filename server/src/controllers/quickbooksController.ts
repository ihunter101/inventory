import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { getPagination, paginatedResponse } from "../utils/pagination";

function toDate(value: unknown) {
  if (!value) return null 

  const date = new Date(String(value))

  return Number.isNaN(date.getTime() ? date : null )
}

export async function getQuickBooksSummary(_req: Request, res: Response) {
  const [
    customerCount,
    invoiceCount,
    paymentCount,
    chequeCount,
    unpaidInvoiceCount,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.customerInvoice.count(),
    prisma.customerPayment.count(),
    prisma.chequePayment.count(),
    prisma.customerInvoice.count({
      where: {
        status: {
          in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"],
        },
      },
    }),
  ]);

  res.json({
    customerCount,
    invoiceCount,
    paymentCount,
    chequeCount,
    unpaidInvoiceCount,
  });
}

export async function getQuickBooksCustomers(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req);

  const search = String(req.query.search ?? "").trim();

  // Default: show customers with balance > 0
  const balanceFilter = String(req.query.balanceFilter ?? "withBalance");

  const searchWhere = search
    ? {
        OR: [
          { companyName: { contains: search, mode: "insensitive" as const } },
          { name: { contains: search, mode: "insensitive" as const } },
          { customerDetail1: { contains: search, mode: "insensitive" as const } },
          { customerDetail2: { contains: search, mode: "insensitive" as const } },
          { customerDetail3: { contains: search, mode: "insensitive" as const } },
          { customerDetail4: { contains: search, mode: "insensitive" as const } },
          { customerDetail5: { contains: search, mode: "insensitive" as const } },
          { subClientName: { contains: search, mode: "insensitive" as const } },
          { accountNumber: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const balanceWhere =
    balanceFilter === "all"
      ? {}
      : balanceFilter === "zeroBalance"
        ? {
            balance: {
              equals: 0,
            },
          }
        : {
            balance: {
              gt: 0,
            },
          };

  const where = {
    ...balanceWhere,
    ...searchWhere,
  };

  const [customers, total, summary, allCustomerSummary] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: [
        { balance: "desc" },
        { totalBalance: "desc" },
        { qbTimeCreated: "desc" },
        { updatedAt: "desc" },
      ],
      skip,
      take: limit,
    }),

    prisma.customer.count({
      where,
    }),

    prisma.customer.aggregate({
      where,
      _count: {
        customerId: true,
      },
      _sum: {
        balance: true,
        totalBalance: true,
      },
    }),

    prisma.customer.aggregate({
      _count: {
        customerId: true,
      },
      _sum: {
        balance: true,
        totalBalance: true,
      },
    }),
  ]);

  res.json({
    ...paginatedResponse({
      data: customers,
      total,
      page,
      limit,
    }),

    summary: {
      filteredCustomerCount: summary._count.customerId,
      filteredBalanceTotal: summary._sum.balance ?? 0,
      filteredTotalBalance: summary._sum.totalBalance ?? 0,

      allCustomerCount: allCustomerSummary._count.customerId,
      allBalanceTotal: allCustomerSummary._sum.balance ?? 0,
      allTotalBalance: allCustomerSummary._sum.totalBalance ?? 0,

      activeFilter: balanceFilter,
    },
  });
}


export const getQuickBooksCustomerById = async (req: Request, res: Response) => {
  try {
  const { customerId } = req.params
  const { page, limit, skip } = getPagination(req)

  const search = String(req.query.search ?? "").trim()

  const status = String(req.query.status ?? "").trim()

  const startDate = toDate(req.query.startDate)
  const endDate = toDate(req.query.endDate)

  const customer = await prisma.customer.findUnique({
    where: { customerId },
    select: {
      customerId: true,
      qbListId: true,
      name: true,
      companyName: true,
      email: true,
      phone: true,
      subClientName: true,
      balance: true,
      totalBalance: true,
      qbTimeCreated: true,
      lastSyncedAt: true,
    },
  });

     if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    };

     const invoiceWhere: any = {
      customerId,
    };

    if (search) {
      invoiceWhere.invoiceNumber = {
        constains: search,
        mode: "insensitive"
      }
    };

    if (status) {
      invoiceWhere.status = {
        constains: status,
        mode: "insensitive"
      }
    }

    if (startDate || endDate ) {
      invoiceWhere.invoiceDate = {
        ...(startDate ?  {gte: startDate} : {}),
        ...(endDate ? {lte: endDate} : {}),
      }
    }

    const [
        invoiceSummary,
      unpaidInvoiceCount,
      invoiceCount,
      paymentSummary,
      paymentCount,
      invoices,
    ] = await prisma.$transaction([
      prisma.customerInvoice.aggregate({
        where: {
          customerId,
        },
        _sum: {
          totalAmount: true,
          amountPaid: true,
          balanceRemaining: true,
        },
        _count: {
          _all: true,
        },
      }),

      prisma.customerInvoice.count({
        where: {
          customerId,
          status: {
            in: ["UNPAID", "PARTIALLY_PAID"],
          },
        },
      }),

      prisma.customerInvoice.count({
        where: invoiceWhere,
      }),

      prisma.customerPayment.aggregate({
        where: {
          customerId,
        },
        _sum: {
          amount: true,
        },
      }),

      prisma.customerPayment.count({
        where: {
          customerId,
        },
      }),

      prisma.customerInvoice.findMany({
        where: invoiceWhere,
        orderBy: {
          invoiceDate: "desc",
        },
        skip,
        take: limit,
        select: {
          invoiceId: true,
          qbTxnId: true,
          invoiceNumber: true,
          invoiceDate: true,
          dueDate: true,
          totalAmount: true,
          amountPaid: true,
          balanceRemaining: true,
          status: true,
          isPaid: true,

          _count: {
            select: {
              lines: true,
              payments: true,
            },
          },
        },
      }),
    ]);

const totalPages = Math.ceil(invoiceCount / limit);
    return res.json({
      customer,

      summary: {
        totalInvoiced: Number(invoiceSummary._sum.totalAmount ?? 0),
        totalPaidFromInvoices: Number(invoiceSummary._sum.amountPaid ?? 0),
        totalPaidFromPayments: Number(paymentSummary._sum.amount ?? 0),
        totalBalance: Number(invoiceSummary._sum.balanceRemaining ?? 0),
        invoiceCount: invoiceSummary._count._all,
        paymentCount,
        unpaidInvoiceCount,
      },

      invoices,

      meta: {
        page,
        limit,
        total: invoiceCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
   } catch (error) {
    console.error("Failed to fetch QuickBooks customer:", error);

    return res.status(500).json({
      message: "Failed to fetch QuickBooks customer",
    });
  }
}

export async function getQuickBooksInvoices(req: Request, res: Response) {
  try {
    const { page, limit, skip } = getPagination(req);

    const search = String(req.query.search ?? "").trim();

    const startDate = req.query.startDate
      ? new Date(String(req.query.startDate))
      : null;

    const endDate = req.query.endDate
      ? new Date(String(req.query.endDate))
      : null;

    // Make end date inclusive.
    // Example: 2026-04-30 becomes filter < 2026-05-01
    if (endDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    const where: any = {
      AND: [],
    };

    if (search) {
      where.AND.push({
        OR: [
          { customerName: { contains: search, mode: "insensitive" as const } },
          { invoiceNumber: { contains: search, mode: "insensitive" as const } },
          { customerDetail1: { contains: search, mode: "insensitive" as const } },
          { customerDetail2: { contains: search, mode: "insensitive" as const } },
          { customerDetail3: { contains: search, mode: "insensitive" as const } },
          { customerDetail4: { contains: search, mode: "insensitive" as const } },
          { customerDetail5: { contains: search, mode: "insensitive" as const } },
          { subClientName: { contains: search, mode: "insensitive" as const } },
        ],
      });
    }

    if (startDate || endDate) {
      where.AND.push({
        invoiceDate: {
          ...(startDate ? { gte: startDate } : {}),
          ...(endDate ? { lt: endDate } : {}),
        },
      });
    }

    const finalWhere = where.AND.length > 0 ? where : undefined;

    const [invoices, total, totals] = await Promise.all([
      prisma.customerInvoice.findMany({
        where: finalWhere,
        orderBy: {
          invoiceDate: "desc",
        },
        skip,
        take: limit,
        include: {
          customer: true,
          payments: true,
          lines: true,
        },
      }),

      prisma.customerInvoice.count({
        where: finalWhere,
      }),

      prisma.customerInvoice.aggregate({
        where: finalWhere,
        _sum: {
          totalAmount: true,
          amountPaid: true,
          balanceRemaining: true,
        },
      }),
    ]);

    const response = paginatedResponse({
      data: invoices,
      total,
      page,
      limit,
    });

    return res.json({
      ...response,
      summary: {
        totalInvoiceAmount: Number(totals._sum.totalAmount ?? 0),
        totalAmountPaid: Number(totals._sum.amountPaid ?? 0),
        totalBalanceRemaining: Number(totals._sum.balanceRemaining ?? 0),
      },
    });
  } catch (error) {
    console.error("Failed to get QuickBooks invoices:", error);

    return res.status(500).json({
      message: "Failed to get QuickBooks invoices",
    });
  }
}

export async function getQuickBooksInvoiceById(req: Request, res: Response) {
  try {
    const { invoiceId } = req.params;

    const invoice = await prisma.customerInvoice.findUnique({
      where: {
        invoiceId,
      },
      include: {
        lines: {
          orderBy: {
            createdAt: "asc",
          },
        },
        customer: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    return res.json(invoice);
  } catch (error) {
    console.error("Failed to get QuickBooks invoice by ID:", error);

    return res.status(500).json({
      message: "Failed to get QuickBooks invoice",
    });
  }
}

export async function getQuickBooksPayments(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req);
  const search = String(req.query.search ?? "").trim();

  const where = search 
    ? {
      OR: [
        { customerName: { contains: search, mode: "insensitive" as const } },
        { customerId: { contains: search, mode: "insensitive" as const } },
        { customerInvoiceId: { contains: search, mode: "insensitive" as const } }, 
        { referenceNumber: { contains: search, mode: "insensitive" as const } },
      ]
    }
    : undefined;

  const [payments, total] = await Promise.all([
    prisma.customerPayment.findMany({
      where,
      orderBy: { paymentDate: "desc" },
      skip,
      take: limit,
      include: {
        customer: true,
        invoice: true,
      },
    }),
    prisma.customerPayment.count({
      where,
    }),
  ]);

  res.json(paginatedResponse({ data: payments, total, page, limit }));
}

export async function getQuickBooksCheques(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req);
  const search = String(req.query.search ?? "").trim();

  const startDate = req.query.startDate
    ? new Date(String(req.query.startDate))
    : null;

  const endDate = req.query.endDate
    ? new Date(String(req.query.endDate))
    : null;

     if (endDate) {
      endDate.setDate(endDate.getDate() + 1);
    }
  const where: any = {
    AND: [],
  };

  if (search) {
    where.AND.push({
      OR: [
        { payeeName: { contains: search, mode: "insensitive" as const } },
        { chequeNumber: { contains: search, mode: "insensitive" as const } },
        { accountName: { contains: search, mode: "insensitive" as const } },
        { memo: { contains: search, mode: "insensitive" as const } },
      ],
    });
  }

  if (startDate || endDate) {
    where.AND.push({
      chequeDate: {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lt: endDate } : {}),
      },
    });
  }

  const finalWhere = where.AND.length > 0 ? where : undefined;

  const [cheques, total, totals] = await Promise.all([
    prisma.chequePayment.findMany({
      where: finalWhere,
      orderBy: { chequeDate: "desc" },
      skip,
      take: limit,
    }),

    prisma.chequePayment.count({
      where: finalWhere,
    }),

    prisma.chequePayment.aggregate({
      where: finalWhere,
      _sum: {
        amount: true,
      },
    }),
  ]);

  const response = paginatedResponse({
    data: cheques,
    total,
    page,
    limit,
  });

  res.json({
    ...response,
    summary: {
      totalChequePayment: Number(totals._sum.amount ?? 0),
    },
  });
}

export async function forceQuickBooksInvoiceBackfill(req: Request, res: Response) {
  try {
    await prisma.quickBooksSyncState.update({
      where: {
        entity: "invoices",
      },
      data: {
        fullBackfillComplete: false,
        lastModifiedSyncAt: null,
      },
    });

    return res.json({
      message: "Invoice backfill reset. Run QuickBooks Web Connector now.",
    });
  } catch (error) {
    console.error("Failed to reset invoice backfill:", error);

    return res.status(500).json({
      message: "Failed to reset invoice backfill",
    });
  }
}