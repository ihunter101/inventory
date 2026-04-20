import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function getQuickBooksCustomers(_req: Request, res: Response) {
    const customer = await prisma.customer.findMany({
        orderBy: { updatedAt: "desc"},
        take: 100
    })

    res.json(customer)
}

export async function getQuickBooksInvoices(_req: Request, res: Response) {
    const invoices = await prisma.customerInvoice.findMany({
        orderBy: { invoiceDate: "desc"},
        take: 100,
        include: {
            customer: true,
            payments: true
        },
    });

    res.json(invoices)
};

export async function getQuickBooksPayments(_req: Request, res: Response){
    const payments = await prisma.customerPayment.findMany({
        orderBy: { paymentDate: "desc"},
        take: 100,
        include: {
            customer: true,
            invoice: true 
        },
    });

    res.json(payments)
};

export async function getQuickBooksCheques(_req: Request, res: Response) {
    const cheques = await prisma.chequePayment.findMany({
        orderBy: { chequeDate: "desc"},
        take: 100,
    });

    res.json(cheques);
};


export async function getQuickBooksSummary(_req: Request, res: Response) {
  const [
    customerCount,
    invoiceCount,
    paymentCount,
    chequeCount,
    unpaidInvoices,
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
    unpaidInvoices,
  });
}