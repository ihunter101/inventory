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

  const where = search
    ? {
        OR: [
          { companyName: { contains: search, mode: "insensitive" as const } },
          { name: { contains: search, mode: "insensitive" as const } },
          { customerDetail1: { contains: search, mode: "insensitive" as const } },
          { customerDetail2: { contains: search, mode: "insensitive" as const } },
          { subClientName: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),

    prisma.customer.count({
      where,
    }),
  ]);

  res.json(
    paginatedResponse({
      data: customers,
      total,
      page,
      limit,
    })
  );
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