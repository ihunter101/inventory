import {
  PaymentMethod,
  QBPaymentSyncStatus,
} from "@prisma/client";
import { prisma } from "../lib/prisma";

type CreateQuickBooksPaymentSyncJobInput = {
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  memo?: string;
};

type BatchCreateQuickBooksPaymentSyncJobsInput = {
  startDate: string;
  endDate: string;
  paymentDate: string;
  paymentMethod?: PaymentMethod;
  referencePrefix?: string;
  memo?: string;
  dryRun?: boolean;

  customerId?: string;
  customerSearch?: string;
};

export async function createQuickBooksPaymentSyncJob(
  input: CreateQuickBooksPaymentSyncJobInput
) {
  const {
    invoiceId,
    amount,
    paymentDate,
    paymentMethod = PaymentMethod.CHEQUE,
    referenceNumber,
    memo,
  } = input;

  const invoice = await prisma.customerInvoice.findUnique({
    where: {
      invoiceId,
    },
    include: {
      customer: true,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  if (!invoice.qbTxnId) {
    throw new Error("Invoice has no QuickBooks TxnID.");
  }

  if (!invoice.customer?.qbListId) {
    throw new Error("Customer has no QuickBooks ListID.");
  }

  const balanceRemaining = Number(invoice.balanceRemaining ?? 0);

  if (amount <= 0) {
    throw new Error("Payment amount must be greater than 0.");
  }

  if (amount > balanceRemaining) {
    throw new Error(
      `Payment amount cannot be greater than invoice balance. Balance remaining is ${balanceRemaining}.`
    );
  }

  const alreadyHasPendingSync =
    await prisma.quickBooksPaymentSyncJob.findFirst({
      where: {
        status: {
          in: [QBPaymentSyncStatus.PENDING, QBPaymentSyncStatus.SENT],
        },
        payment: {
          customerInvoiceId: invoice.invoiceId,
        },
      },
    });

  if (alreadyHasPendingSync) {
    throw new Error(
      "Invoice already has a pending/sent QuickBooks payment sync job."
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.customerPayment.create({
      data: {
        customerId: invoice.customerId,
        customerInvoiceId: invoice.invoiceId,
        customerName: invoice.customerName,
        amount,
        paymentDate: new Date(paymentDate),
        method: paymentMethod,
        referenceNumber,
        notes: memo || "Payment recorded from custom app",
        source: "INTERNAL",
      },
    });

    const syncJob = await tx.quickBooksPaymentSyncJob.create({
      data: {
        localPaymentId: payment.paymentId,
        status: QBPaymentSyncStatus.PENDING,
        qbRequestId: `RECEIVE_PAYMENT_${payment.paymentId}_${Date.now()}`,
        qbCustomerListId: invoice.customer!.qbListId!,
        qbInvoiceTxnId: invoice.qbTxnId!,
      },
    });

    return {
      payment,
      syncJob,
      invoice,
    };
  });

  return result;
}

export async function batchCreateQuickBooksPaymentSyncJobs(
  input: BatchCreateQuickBooksPaymentSyncJobsInput
) {
  const {
    startDate,
    endDate,
    paymentDate,
    paymentMethod = PaymentMethod.CHEQUE,
    referencePrefix = "BATCH-PAY",
    memo = "Batch payment recorded from custom app",
    dryRun = false,
    customerId,
    customerSearch,
  } = input;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const paidAt = new Date(paymentDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid startDate or endDate.");
  }

  if (Number.isNaN(paidAt.getTime())) {
    throw new Error("Invalid paymentDate.");
  }

  const invoices = await prisma.customerInvoice.findMany({
    where: {
      invoiceDate: {
        gte: start,
        lte: end,
      },
      status: {
        in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"],
      },
      balanceRemaining: {
        gt: 0,
      },

      ...(customerId
        ? {
            customerId,
          }
        : {}),

      ...(!customerId && customerSearch
        ? {
            OR: [
              {
                customerName: {
                  contains: customerSearch,
                  mode: "insensitive",
                },
              },
              {
                customer: {
                  name: {
                    contains: customerSearch,
                    mode: "insensitive",
                  },
                },
              },
              {
                customer: {
                  companyName: {
                    contains: customerSearch,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      customer: true,
    },
    orderBy: {
      invoiceDate: "asc",
    },
  });

  const results = {
    found: invoices.length,
    queued: 0,
    skipped: 0,
    failed: 0,
    dryRun,
    items: [] as Array<{
      invoiceId: string;
      invoiceNumber: string | null;
      customerName: string;
      amount: number;
      status: "WOULD_QUEUE" | "QUEUED" | "SKIPPED" | "FAILED";
      reason?: string;
      paymentId?: string;
      syncJobId?: string;
    }>,
  };

  for (const invoice of invoices) {
    const balanceRemaining = Number(invoice.balanceRemaining ?? 0);

    try {
      if (!invoice.qbTxnId) {
        results.skipped++;
        results.items.push({
          invoiceId: invoice.invoiceId,
          invoiceNumber: invoice.invoiceNumber,
          customerName: invoice.customerName,
          amount: balanceRemaining,
          status: "SKIPPED",
          reason: "Invoice has no QuickBooks TxnID.",
        });
        continue;
      }

      if (!invoice.customer?.qbListId) {
        results.skipped++;
        results.items.push({
          invoiceId: invoice.invoiceId,
          invoiceNumber: invoice.invoiceNumber,
          customerName: invoice.customerName,
          amount: balanceRemaining,
          status: "SKIPPED",
          reason: "Customer has no QuickBooks ListID.",
        });
        continue;
      }

      if (balanceRemaining <= 0) {
        results.skipped++;
        results.items.push({
          invoiceId: invoice.invoiceId,
          invoiceNumber: invoice.invoiceNumber,
          customerName: invoice.customerName,
          amount: balanceRemaining,
          status: "SKIPPED",
          reason: "Invoice has no remaining balance.",
        });
        continue;
      }

      const alreadyHasPendingSync =
        await prisma.quickBooksPaymentSyncJob.findFirst({
          where: {
            status: {
              in: [QBPaymentSyncStatus.PENDING, QBPaymentSyncStatus.SENT],
            },
            payment: {
              customerInvoiceId: invoice.invoiceId,
            },
          },
        });

      if (alreadyHasPendingSync) {
        results.skipped++;
        results.items.push({
          invoiceId: invoice.invoiceId,
          invoiceNumber: invoice.invoiceNumber,
          customerName: invoice.customerName,
          amount: balanceRemaining,
          status: "SKIPPED",
          reason:
            "Invoice already has a pending/sent QuickBooks payment sync job.",
        });
        continue;
      }

      if (dryRun) {
        results.items.push({
          invoiceId: invoice.invoiceId,
          invoiceNumber: invoice.invoiceNumber,
          customerName: invoice.customerName,
          amount: balanceRemaining,
          status: "WOULD_QUEUE",
        });
        continue;
      }

      const result = await prisma.$transaction(async (tx) => {
        const payment = await tx.customerPayment.create({
          data: {
            customerId: invoice.customerId,
            customerInvoiceId: invoice.invoiceId,
            customerName: invoice.customerName,
            paymentDate: paidAt,
            amount: balanceRemaining,
            method: paymentMethod,
            referenceNumber: `${referencePrefix}-${
              invoice.invoiceNumber || invoice.invoiceId
            }`,
            notes: memo,
            source: "INTERNAL",
          },
        });

        const syncJob = await tx.quickBooksPaymentSyncJob.create({
          data: {
            localPaymentId: payment.paymentId,
            status: QBPaymentSyncStatus.PENDING,
            qbRequestId: `RECEIVE_PAYMENT_${payment.paymentId}_${Date.now()}`,
            qbCustomerListId: invoice.customer!.qbListId!,
            qbInvoiceTxnId: invoice.qbTxnId!,
          },
        });

        return {
          payment,
          syncJob,
        };
      });

      results.queued++;
      results.items.push({
        invoiceId: invoice.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        amount: balanceRemaining,
        status: "QUEUED",
        paymentId: result.payment.paymentId,
        syncJobId: result.syncJob.id,
      });
    } catch (error: any) {
      results.failed++;
      results.items.push({
        invoiceId: invoice.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        amount: balanceRemaining,
        status: "FAILED",
        reason: error.message || "Failed to queue payment.",
      });
    }
  }

  return results;
}

export async function listQuickBooksPaymentSyncJobs(params: { status?: string }) {
  const { status } = params;

  return prisma.quickBooksPaymentSyncJob.findMany({
    where: {
      ...(status ? { status: status as QBPaymentSyncStatus } : {}),
    },
    include: {
      payment: {
        include: {
          invoice: {
            include: {
              customer: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });
}

export async function retryQuickBooksPaymentSyncJobById(jobId: string) {
  const job = await prisma.quickBooksPaymentSyncJob.findUnique({
    where: {
      id: jobId,
    },
  });

  if (!job) {
    throw new Error("QuickBooks payment sync job not found.");
  }

  if (job.status !== QBPaymentSyncStatus.FAILED) {
    throw new Error("Only failed QuickBooks payment sync jobs can be retried.");
  }

  return prisma.quickBooksPaymentSyncJob.update({
    where: {
      id: jobId,
    },
    data: {
      status: QBPaymentSyncStatus.PENDING,
      errorMessage: null,
    },
  });
}