import { QBPaymentSyncStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { buildReceivePaymentBatchAddRq } from "../quickbooks/quickbooksPaymentQbxmlBuilder";

const DEFAULT_BATCH_SIZE = 50;
const MAX_BATCH_SIZE = 50;

function getBatchSize() {
  const raw = Number(process.env.QB_PAYMENT_WRITE_BATCH_SIZE ?? DEFAULT_BATCH_SIZE);

  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_BATCH_SIZE;

  return Math.min(Math.floor(raw), MAX_BATCH_SIZE);
}

export async function getPendingQuickBooksPaymentWriteBatchXML() {
  const batchSize = getBatchSize();

  const jobs = await prisma.quickBooksPaymentSyncJob.findMany({
    where: {
      status: QBPaymentSyncStatus.PENDING,
    },
    include: {
      payment: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: batchSize,
  });

  if (jobs.length === 0) return null;

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

      continue;
    }

    validJobs.push(job);
  }

  if (validJobs.length === 0) return null;

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

  const remainingPendingCount = await prisma.quickBooksPaymentSyncJob.count({
    where: {
      status: QBPaymentSyncStatus.PENDING,
    },
  });

  return {
    qbxml,
    sentCount: validJobs.length,
    remainingPendingCount,
    batchSize,
  };
}