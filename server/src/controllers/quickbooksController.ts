import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { getPagination, paginatedResponse } from "../utils/pagination";

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

export async function getQuickBooksCustomerById(req: Request, res: Response) {
  const { customerId } = req.params;

  const customer = await prisma.customer.findUnique({
    where: {
      customerId,
    },
    include: {
      invoices: {
        orderBy: {
          invoiceDate: "desc",
        },
        include: {
          lines: true,
          payments: true,
        },
      },
      payments: {
        orderBy: {
          paymentDate: "desc",
        },
      },
    },
  });

  if (!customer) {
    return res.status(404).json({
      message: "Customer not found",
    });
  }

  const totalInvoiced = customer.invoices.reduce(
    (sum, invoice) => sum + Number(invoice.totalAmount ?? 0),
    0
  );

  const totalPaid = customer.payments.reduce(
    (sum, payment) => sum + Number(payment.amount ?? 0),
    0
  );

  const totalBalance = customer.invoices.reduce(
    (sum, invoice) => sum + Number(invoice.balanceRemaining ?? 0),
    0
  );

  const unpaidInvoiceCount = customer.invoices.filter(
    (invoice) => invoice.status === "UNPAID" || invoice.status === "PARTIALLY_PAID"
  ).length;

  res.json({
    customer,
    summary: {
      totalInvoiced,
      totalPaid,
      totalBalance,
      invoiceCount: customer.invoices.length,
      paymentCount: customer.payments.length,
      unpaidInvoiceCount,
    },
  });
}

export async function getQuickBooksInvoices(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req);

  const search = String(req.query.search ?? "").trim();

  const where = search 
    ? {
      OR: [
        { customerName: { contains: search, mode: "insensitive" as const } },
        { invoiceNumber: { contains: search, mode: "insensitive" as const } },
        { customerDetail1: { contains: search, mode: "insensitive"  as const } },
        { customerDetail2: { contains: search, mode: "insensitive" as const } },
        { customerDetail3: { contains: search, mode: "insensitive" as const } },
        { subClientName: { contains: search, mode: "insensitive" as const } },
      ],
    }
    : undefined

  const [invoices, total] = await Promise.all([
    prisma.customerInvoice.findMany({
      where,
      orderBy: { invoiceDate: "desc" },
      skip,
      take: limit,
      include: {
        customer: true,
        payments: true,
        lines: true,
      },
    }),
    prisma.customerInvoice.count({
      where,
    }),
  ]);

  res.json(paginatedResponse({ data: invoices, total, page, limit }));
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


  const where = search 
    ? {
      OR: [
        { payeeName: { contains: search, mode: "insensitive" as const} },
        { chequeNumber: { contains: search, mode: "insensitive" as const} },
        { accountName: { contains: search, mode: "insensitive" as const } },
        { memo: { contains: search, mode: "insensitive" as const } },
      ],
    }
    : undefined;

  const [cheques, total] = await Promise.all([
    prisma.chequePayment.findMany({
      where,
      orderBy: { chequeDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.chequePayment.count({
      where
    }),
  ]);

  res.json(paginatedResponse({ data: cheques, total, page, limit }));
}