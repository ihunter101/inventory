import { QBPaymentSyncStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export async function reconcilePaymentSyncJobsFromReceivePayments(
  receivePayments: any[]
) {
  for (const qbPayment of receivePayments) {
    const refNumber = qbPayment?.RefNumber;
    const qbTxnId = qbPayment?.TxnID;
    const qbEditSequence = qbPayment?.EditSequence;
    const totalAmount = Number(qbPayment?.TotalAmount ?? 0);

    if (!refNumber || !qbTxnId || !Number.isFinite(totalAmount)) {
      continue;
    }

    const localPayment = await prisma.customerPayment.findFirst({
      where: {
        referenceNumber: refNumber,
        amount: totalAmount,
      },
      include: {
        qbPaymentSyncJob: true,
      },
    });

    if (!localPayment?.qbPaymentSyncJob) {
      continue;
    }

    const job = localPayment.qbPaymentSyncJob;

    if (job.status === QBPaymentSyncStatus.SUCCESS) {
      continue;
    }

    await prisma.quickBooksPaymentSyncJob.update({
      where: {
        id: job.id,
      },
      data: {
        status: QBPaymentSyncStatus.SUCCESS,
        qbPaymentTxnId: qbTxnId,
        qbPaymentEditSequence: qbEditSequence ?? null,
        syncedAt: new Date(),
        errorMessage: null,
      },
    });

    await prisma.customerPayment.update({
      where: {
        paymentId: localPayment.paymentId,
      },
      data: {
        qbTxnId,
        qbEditSequence: qbEditSequence ?? null,
        lastSyncedAt: new Date(),
      },
    });
  }
}