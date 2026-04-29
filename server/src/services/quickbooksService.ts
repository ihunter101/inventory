//server/src/service/quickbooksService.ts
// server/src/service/quickbooksService.ts

import { CustomerInvoiceStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

const QB_START_DATE = new Date("2025-06-01T00:00:00");

function dedupeBy<T>(items: T[], getKey: (item: T) => string | undefined | null): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const key = getKey(item);
    if (!key) continue;

    if (seen.has(key)) continue;

    seen.add(key);
    result.push(item);
  }

  return result;
}

function toDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function wasCreatedFromStartDate(item: any) {
  const createdAt = toDate(item.TimeCreated);
  if (!createdAt) return false;

  return createdAt >= QB_START_DATE;
}

function toDecimalString(value?: string | number | null) {
  if (value === undefined || value === null || value === "") return "0";
  return String(value);
}

function stringifyRaw(data: unknown) {
  return JSON.stringify(data);
}

export async function saveQuickBooksData(type: string, data: any[]) {
  if (!data.length) return;

  // Customers are master records.
  // Save all customers so invoices can link correctly.
  if (type === "customers") {
    await saveCustomers(dedupeBy(data, (customer) => customer.ListID));
    return;
  }

  // Transactions only: keep records created from June 1, 2025 onward.
  const filteredData = data.filter(wasCreatedFromStartDate);

  if (!filteredData.length) {
    console.log(`No ${type} records created from 2025-06-01 onward.`);
    return;
  }

  if (type === "invoices") {
    await saveCustomerInvoices(dedupeBy(filteredData, (invoice) => invoice.TxnID));
    return;
  }

  if (type === "receivePayments") {
    await saveCustomerPayments(dedupeBy(filteredData, (payment) => payment.TxnID));
    return;
  }

  if (type === "checks") {
    await saveChequePayments(dedupeBy(filteredData, (check) => check.TxnID));
    return;
  }
}

async function saveCustomers(customers: any[]) {
  for (const customer of customers) {
    const qbListId = customer.ListID;
    if (!qbListId) continue;

    const qbCustomerDetails = customer.BillAddress || {};

    const customerName =
      customer.FullName ||
      customer.Name ||
      customer.CompanyName ||
      "Unknown Customer";

    const data = {
      qbEditSequence: customer.EditSequence || null,
      qbTimeCreated: toDate(customer.TimeCreated),

      name: customerName,
      companyName: customer.CompanyName || customerName,

      email: customer.Email || null,
      phone: customer.Phone || null,

      altContact: customer.AltContact || null,
      accountNumber: customer.AccountNumber || null,

      balance: toDecimalString(customer.Balance),
      totalBalance: toDecimalString(customer.TotalBalance),
      termsName: customer.TermsRef?.FullName || null,

      customerDetail1: qbCustomerDetails.Addr1 || null,
      customerDetail2: qbCustomerDetails.Addr2 || null,
      customerDetail3: qbCustomerDetails.Addr3 || null,
      customerDetail4: qbCustomerDetails.Addr4 || null,
      customerDetail5: qbCustomerDetails.Addr5 || null,

      subClientName: qbCustomerDetails.Addr2 || null,

      source: "QUICKBOOKS" as const,
      rawJson: stringifyRaw(customer),
      lastSyncedAt: new Date(),
    };

    await prisma.customer.upsert({
      where: {
        qbListId,
      },
      update: data,
      create: {
        qbListId,
        ...data,
      },
    });
  }
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

async function saveCustomerInvoices(invoices: any[]) {
  for (const invoice of invoices) {
    const qbTxnId = invoice.TxnID;
    if (!qbTxnId) continue;

    const customerName =
      invoice.CustomerRef?.FullName ||
      invoice.BillAddress?.Addr1 ||
      "Unknown Customer";

    const customer = invoice.CustomerRef?.ListID
      ? await prisma.customer.findUnique({
          where: {
            qbListId: invoice.CustomerRef.ListID,
          },
        })
      : null;

    const billDetails = invoice.BillAddress || {};

    const subtotal = Number(invoice.Subtotal || 0);
    const taxTotal = Number(invoice.SalesTaxTotal || 0);
    const balanceRemaining = Number(invoice.BalanceRemaining || 0);

    const totalAmount = subtotal + taxTotal;
    const isPaid = invoice.IsPaid === "true";

    const status: CustomerInvoiceStatus = isPaid
      ? CustomerInvoiceStatus.PAID
      : balanceRemaining < totalAmount
        ? CustomerInvoiceStatus.PARTIALLY_PAID
        : CustomerInvoiceStatus.UNPAID;

    const invoiceData = {
      qbTxnNumber: invoice.TxnNumber || null,
      qbEditSequence: invoice.EditSequence || null,

      customerId: customer?.customerId || null,
      customerName,

      invoiceNumber: invoice.RefNumber || null,

      arAccountName: invoice.ARAccountRef?.FullName || null,
      templateName: invoice.TemplateRef?.FullName || null,
      termsName: invoice.TermsRef?.FullName || null,
      salesRepName: invoice.SalesRepRef?.FullName || null,

      invoiceDate: toDate(invoice.TxnDate),
      dueDate: toDate(invoice.DueDate),
      shipServiceDate: toDate(invoice.ShipDate),

      customerDetail1: billDetails.Addr1 || null,
      customerDetail2: billDetails.Addr2 || null,
      customerDetail3: billDetails.Addr3 || null,
      customerDetail4: billDetails.Addr4 || null,
      customerDetail5: billDetails.Addr5 || null,

      subClientName: billDetails.Addr2 || null,

      memo: invoice.Memo || null,

      subtotal: toDecimalString(invoice.Subtotal),
      taxPercentage: toDecimalString(invoice.SalesTaxPercentage),
      taxTotal: toDecimalString(invoice.SalesTaxTotal),
      appliedAmount: toDecimalString(invoice.AppliedAmount),
      totalAmount: toDecimalString(totalAmount),
      balanceRemaining: toDecimalString(invoice.BalanceRemaining),
      amountPaid: toDecimalString(totalAmount - balanceRemaining),

      isPending: invoice.IsPending === "true",
      isFinanceCharge: invoice.IsFinanceCharge === "true",
      isPaid,
      isToBePrinted: invoice.IsToBePrinted === "true",

      status,
      source: "QUICKBOOKS" as const,
      rawJson: stringifyRaw(invoice),
      lastSyncedAt: new Date(),
    };

    const savedInvoice = await prisma.customerInvoice.upsert({
      where: {
        qbTxnId,
      },
      update: invoiceData,
      create: {
        qbTxnId,
        ...invoiceData,
      },
    });

    const lines = asArray(invoice.InvoiceLineRet);

    await prisma.customerInvoiceLine.deleteMany({
      where: {
        invoiceId: savedInvoice.invoiceId,
      },
    });

    if (lines.length) {
      await prisma.customerInvoiceLine.createMany({
        data: lines.map((line: any) => ({
          invoiceId: savedInvoice.invoiceId,

          qbTxnLineId: line.TxnLineID || null,

          itemListId: line.ItemRef?.ListID || null,
          itemName: line.ItemRef?.FullName || null,

          description: line.Desc || null,

          classListId: line.ClassRef?.ListID || null,
          className: line.ClassRef?.FullName || null,

          quantity: line.Quantity ? toDecimalString(line.Quantity) : null,
          rate: line.Rate ? toDecimalString(line.Rate) : null,
          amount: line.Amount ? toDecimalString(line.Amount) : null,

          serviceDate: toDate(line.ServiceDate),

          rawJson: stringifyRaw(line),
        })),
      });
    }
  }
}

async function saveCustomerPayments(payments: any[]) {
  for (const payment of payments) {
    const qbTxnId = payment.TxnID;
    if (!qbTxnId) continue;

    const customerName = payment.CustomerRef?.FullName || "Unknown Customer";

    const customer = payment.CustomerRef?.ListID
      ? await prisma.customer.findUnique({
          where: {
            qbListId: payment.CustomerRef.ListID,
          },
        })
      : null;

    await prisma.customerPayment.upsert({
      where: {
        qbTxnId,
      },
      update: {
        qbEditSequence: payment.EditSequence,
        customerId: customer?.customerId || null,
        customerName,
        paymentDate: toDate(payment.TxnDate) || new Date(),
        amount: toDecimalString(payment.TotalAmount),
        method: mapPaymentMethod(payment.PaymentMethodRef?.FullName),
        referenceNumber: payment.RefNumber || null,
        source: "QUICKBOOKS",
        rawJson: stringifyRaw(payment),
        lastSyncedAt: new Date(),
      },
      create: {
        qbTxnId,
        qbEditSequence: payment.EditSequence,
        customerId: customer?.customerId || null,
        customerName,
        paymentDate: toDate(payment.TxnDate) || new Date(),
        amount: toDecimalString(payment.TotalAmount),
        method: mapPaymentMethod(payment.PaymentMethodRef?.FullName),
        referenceNumber: payment.RefNumber || null,
        source: "QUICKBOOKS",
        rawJson: stringifyRaw(payment),
        lastSyncedAt: new Date(),
      },
    });
  }
}

async function saveChequePayments(checks: any[]) {
  for (const check of checks) {
    const qbTxnId = check.TxnID;
    if (!qbTxnId) continue;

    const data = {
      qbEditSequence: check.EditSequence,
      payeeName:
        check.PayeeEntityRef?.FullName ||
        check.EntityRef?.FullName ||
        "Unknown Payee",
      chequeNumber: check.RefNumber || null,
      chequeDate: toDate(check.TxnDate),
      amount: toDecimalString(check.Amount),
      accountName: check.AccountRef?.FullName || null,
      memo: check.Memo || null,
      status: "UNKNOWN" as const,
      source: "QUICKBOOKS" as const,
      rawJson: stringifyRaw(check),
      lastSyncedAt: new Date(),
    };

    await prisma.chequePayment.upsert({
      where: {
        qbTxnId,
      },
      update: data,
      create: {
        qbTxnId,
        ...data,
      },
    });
  }
}

function mapPaymentMethod(method?: string | null) {
  if (!method) return null;

  const normalized = method.toLowerCase();

  if (normalized.includes("cash")) return "CASH";
  if (normalized.includes("credit")) return "CREDIT_CARD";
  if (normalized.includes("debit")) return "DEBIT_CARD";
  if (normalized.includes("check") || normalized.includes("cheque")) return "CHEQUE";
  if (normalized.includes("bank") || normalized.includes("transfer")) return "BANK_TRANSFER";

  return "OTHER";
}