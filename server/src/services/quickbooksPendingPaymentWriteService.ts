import { QBPaymentSyncStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { buildReceivePaymentAddRq } from "../quickbooks/quickbooksPaymentQbxmlBuilder";

export async function getNextPendingQuickBooksPaymentWriteXML() {
  const job = await prisma.quickBooksPaymentSyncJob.findFirst({
    where: {
      status: QBPaymentSyncStatus.PENDING,
    },
    include: {
      payment: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!job) return null;

  if (!job.payment) {
    await prisma.quickBooksPaymentSyncJob.update({
      where: { id: job.id },
      data: {
        status: QBPaymentSyncStatus.FAILED,
        errorMessage: "No CustomerPayment linked to this sync job.",
      },
    });

    return null;
  }

  const qbxml = buildReceivePaymentAddRq({
    requestId: job.qbRequestId,
    customerListId: job.qbCustomerListId,
    invoiceTxnId: job.qbInvoiceTxnId,
    paymentDate: job.payment.paymentDate,
    amount: Number(job.payment.amount),
    paymentMethod: job.payment.method,
    referenceNumber: job.payment.referenceNumber,
    memo: job.payment.notes,
  });

  await prisma.quickBooksPaymentSyncJob.update({
    where: { id: job.id },
    data: {
      status: QBPaymentSyncStatus.SENT,
      attempts: {
        increment: 1,
      },
    },
  });

  return qbxml;
}