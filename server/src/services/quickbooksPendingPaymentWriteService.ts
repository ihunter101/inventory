import { QBPaymentSyncStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { buildReceivePaymentBatchAddRq } from "../quickbooks/quickbooksPaymentQbxmlBuilder";

const DEFAULT_BATCH_SIZE = 25;
const MAX_BATCH_SIZE = 50;
const MAX_ATTEMPTS = 3;

function getBatchSize() {
  const raw = Number(
    process.env.QB_PAYMENT_WRITE_BATCH_SIZE ?? DEFAULT_BATCH_SIZE
  );

  if (!Number.isFinite(raw) || raw <= 0) {
    return DEFAULT_BATCH_SIZE;
  }

  return Math.min(Math.floor(raw), MAX_BATCH_SIZE);
}

export async function countPendingQuickBooksPaymentSyncJobs() {
  return prisma.quickBooksPaymentSyncJob.count({
    where: {
      status: QBPaymentSyncStatus.PENDING,
      attempts: {
        lt: MAX_ATTEMPTS,
      },
    },
  });
}

export async function getPendingQuickBooksPaymentWriteBatchXML() {
  const batchSize = getBatchSize();

  const jobs = await prisma.quickBooksPaymentSyncJob.findMany({
    where: {
      status: QBPaymentSyncStatus.PENDING,
      attempts: {
        lt: MAX_ATTEMPTS,
      },
    },
    include: {
      payment: {
        include: {
          invoice: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: batchSize,
  });

  if (jobs.length === 0) {
    return null;
  }

  const validJobs = [];

  for (const job of jobs) {
    if (!job.payment) {
      await prisma.quickBooksPaymentSyncJob.update({
        where: {
          id: job.id,
        },
        data: {
          status: QBPaymentSyncStatus.FAILED,
          errorMessage: "No CustomerPayment linked to this sync job.",
        },
      });

      console.error("QB PAYMENT WRITE JOB FAILED BEFORE SEND:");
      console.error({
        jobId: job.id,
        requestId: job.qbRequestId,
        reason: "No CustomerPayment linked to this sync job.",
      });

      continue;
    }

    if (!job.qbCustomerListId) {
      await prisma.quickBooksPaymentSyncJob.update({
        where: {
          id: job.id,
        },
        data: {
          status: QBPaymentSyncStatus.FAILED,
          errorMessage: "Missing QuickBooks customer ListID.",
        },
      });

      console.error("QB PAYMENT WRITE JOB FAILED BEFORE SEND:");
      console.error({
        jobId: job.id,
        requestId: job.qbRequestId,
        invoiceNumber: job.payment.invoice?.invoiceNumber,
        reason: "Missing QuickBooks customer ListID.",
      });

      continue;
    }

    if (!job.qbInvoiceTxnId) {
      await prisma.quickBooksPaymentSyncJob.update({
        where: {
          id: job.id,
        },
        data: {
          status: QBPaymentSyncStatus.FAILED,
          errorMessage: "Missing QuickBooks invoice TxnID.",
        },
      });

      console.error("QB PAYMENT WRITE JOB FAILED BEFORE SEND:");
      console.error({
        jobId: job.id,
        requestId: job.qbRequestId,
        invoiceNumber: job.payment.invoice?.invoiceNumber,
        reason: "Missing QuickBooks invoice TxnID.",
      });

      continue;
    }

    validJobs.push(job);
  }

  if (validJobs.length === 0) {
    return null;
  }

  console.log("QB PAYMENT WRITE BATCH ITEMS:");
  for (const job of validJobs) {
    console.log({
      jobId: job.id,
      requestId: job.qbRequestId,
      invoiceNumber: job.payment?.invoice?.invoiceNumber,
      invoiceId: job.payment?.customerInvoiceId,
      qbInvoiceTxnId: job.qbInvoiceTxnId,
      customerName: job.payment?.customerName,
      referenceNumber: job.payment?.referenceNumber,
      amount: String(job.payment?.amount),
      attemptNumber: job.attempts + 1,
    });
  }

  const qbxml = buildReceivePaymentBatchAddRq(
    validJobs.map((job) => ({
      requestId: job.qbRequestId,
      customerListId: job.qbCustomerListId,
      invoiceTxnId: job.qbInvoiceTxnId,
      paymentDate: job.payment!.paymentDate,
      amount: Number(job.payment!.amount),
      paymentMethod: job.payment!.method,
      referenceNumber: job.payment!.referenceNumber,
      memo: job.payment!.notes,
    }))
  );

  await prisma.quickBooksPaymentSyncJob.updateMany({
    where: {
      id: {
        in: validJobs.map((job) => job.id),
      },
    },
    data: {
      status: QBPaymentSyncStatus.SENT,
      attempts: {
        increment: 1,
      },
    },
  });

  const remainingPendingCount = await countPendingQuickBooksPaymentSyncJobs();

  console.log("QB PAYMENT WRITE BATCH SENT:");
  console.log({
    sentCount: validJobs.length,
    batchSize,
    remainingPendingCount,
  });

  return {
    qbxml,
    sentCount: validJobs.length,
    remainingPendingCount,
    batchSize,
  };
}