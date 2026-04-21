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

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.customer.count(),
  ]);

  res.json(paginatedResponse({ data: customers, total, page, limit }));
}

export async function getQuickBooksInvoices(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req);

  const [invoices, total] = await Promise.all([
    prisma.customerInvoice.findMany({
      orderBy: { invoiceDate: "desc" },
      skip,
      take: limit,
      include: {
        customer: true,
        payments: true,
      },
    }),
    prisma.customerInvoice.count(),
  ]);

  res.json(paginatedResponse({ data: invoices, total, page, limit }));
}

export async function getQuickBooksPayments(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req);

  const [payments, total] = await Promise.all([
    prisma.customerPayment.findMany({
      orderBy: { paymentDate: "desc" },
      skip,
      take: limit,
      include: {
        customer: true,
        invoice: true,
      },
    }),
    prisma.customerPayment.count(),
  ]);

  res.json(paginatedResponse({ data: payments, total, page, limit }));
}

export async function getQuickBooksCheques(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req);

  const [cheques, total] = await Promise.all([
    prisma.chequePayment.findMany({
      orderBy: { chequeDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.chequePayment.count(),
  ]);

  res.json(paginatedResponse({ data: cheques, total, page, limit }));
}