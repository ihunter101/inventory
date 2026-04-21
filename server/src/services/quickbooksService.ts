import { prisma } from "../lib/prisma";

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

function toDecimalString(value?: string | number | null) {
  if (value === undefined || value === null || value === "") return "0";
  return String(value);
}

function stringifyRaw(data: unknown) {
  return JSON.stringify(data);
}

export async function saveQuickBooksData(type: string, data: any[]) {
  if (!data.length) return;

  if (type === "customers") {
    await saveCustomers(dedupeBy(data, (customer) => customer.ListID));
    return;
  }

  if (type === "invoices") {
    await saveCustomerInvoices(dedupeBy(data, (invoice) => invoice.TxnID));
    return;
  }

  if (type === "receivePayments") {
    await saveCustomerPayments(dedupeBy(data, (payment) => payment.TxnID));
    return;
  }

  if (type === "checks") {
    await saveChequePayments(dedupeBy(data, (check) => check.TxnID));
    return;
  }
}
async function saveCustomers(customers: any[]) {
  for (const customer of customers) {
    const qbListId = customer.ListID;
    if (!qbListId) continue;

    await prisma.customer.upsert({
      where: {
        qbListId,
      },
      update: {
        qbEditSequence: customer.EditSequence,
        name: customer.FullName || customer.Name || "Unknown Customer",
        companyName: customer.CompanyName || null,
        email: customer.Email || null,
        phone: customer.Phone || null,
        source: "QUICKBOOKS",
        rawJson: stringifyRaw(customer),
        lastSyncedAt: new Date(),
      },
      create: {
        qbListId,
        qbEditSequence: customer.EditSequence,
        name: customer.FullName || customer.Name || "Unknown Customer",
        companyName: customer.CompanyName || null,
        email: customer.Email || null,
        phone: customer.Phone || null,
        source: "QUICKBOOKS",
        rawJson: stringifyRaw(customer),
        lastSyncedAt: new Date(),
      },
    });
  }
}

async function saveCustomerInvoices(invoices: any[]) {
  for (const invoice of invoices) {
    const qbTxnId = invoice.TxnID;
    if (!qbTxnId) continue;

    const customerName = invoice.CustomerRef?.FullName || "Unknown Customer";

    const customer = invoice.CustomerRef?.ListID
      ? await prisma.customer.findUnique({
          where: {
            qbListId: invoice.CustomerRef.ListID,
          },
        })
      : null;

    const totalAmount =
      Number(invoice.Subtotal || 0) + Number(invoice.SalesTaxTotal || 0);

    const balanceRemaining = Number(invoice.BalanceRemaining || 0);

    const status =
      invoice.IsPaid === "true"
        ? "PAID"
        : balanceRemaining < totalAmount
          ? "PARTIALLY_PAID"
          : "UNPAID";

    await prisma.customerInvoice.upsert({
      where: {
        qbTxnId,
      },
      update: {
        qbEditSequence: invoice.EditSequence,
        customerId: customer?.customerId || null,
        customerName,
        invoiceNumber: invoice.RefNumber || null,
        invoiceDate: toDate(invoice.TxnDate),
        dueDate: toDate(invoice.DueDate),
        subtotal: toDecimalString(invoice.Subtotal),
        taxTotal: toDecimalString(invoice.SalesTaxTotal),
        totalAmount: toDecimalString(totalAmount),
        balanceRemaining: toDecimalString(invoice.BalanceRemaining),
        amountPaid: toDecimalString(totalAmount - balanceRemaining),
        status,
        source: "QUICKBOOKS",
        rawJson: stringifyRaw(invoice),
        lastSyncedAt: new Date(),
      },
      create: {
        qbTxnId,
        qbEditSequence: invoice.EditSequence,
        customerId: customer?.customerId || null,
        customerName,
        invoiceNumber: invoice.RefNumber || null,
        invoiceDate: toDate(invoice.TxnDate),
        dueDate: toDate(invoice.DueDate),
        subtotal: toDecimalString(invoice.Subtotal),
        taxTotal: toDecimalString(invoice.SalesTaxTotal),
        totalAmount: toDecimalString(totalAmount),
        balanceRemaining: toDecimalString(invoice.BalanceRemaining),
        amountPaid: toDecimalString(totalAmount - balanceRemaining),
        status,
        source: "QUICKBOOKS",
        rawJson: stringifyRaw(invoice),
        lastSyncedAt: new Date(),
      },
    });
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

    await prisma.chequePayment.upsert({
      where: {
        qbTxnId,
      },
      update: {
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
        status: "UNKNOWN",
        source: "QUICKBOOKS",
        rawJson: stringifyRaw(check),
        lastSyncedAt: new Date(),
      },
      create: {
        qbTxnId,
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
        status: "UNKNOWN",
        source: "QUICKBOOKS",
        rawJson: stringifyRaw(check),
        lastSyncedAt: new Date(),
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