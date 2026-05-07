import { parseStringPromise } from "xml2js";
import {
  QBPaymentSyncStatus,
  CustomerInvoiceStatus,
} from "@prisma/client";
import { prisma } from "../lib/prisma";

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export async function handleReceivePaymentAddResponse(rawResponseXml: string) {
  if (!rawResponseXml || !rawResponseXml.includes("ReceivePaymentAddRs")) {
    return false;
  }

  const parsed = await parseStringPromise(rawResponseXml, {
    explicitArray: false,
    ignoreAttrs: false,
  });

  const addResponses = asArray(
    parsed?.QBXML?.QBXMLMsgsRs?.ReceivePaymentAddRs
  );

  if (addResponses.length === 0) {
    return false;
  }

  for (const addRs of addResponses) {
    const requestId = addRs?.$?.requestID;
    const statusCode = String(addRs?.$?.statusCode ?? "");
    const statusSeverity = addRs?.$?.statusSeverity;
    const statusMessage = addRs?.$?.statusMessage;

    if (!requestId) {
      console.warn("ReceivePaymentAddRs returned without requestID.");
      continue;
    }

    const job = await prisma.quickBooksPaymentSyncJob.findUnique({
      where: {
        qbRequestId: requestId,
      },
      include: {
        payment: {
          include: {
            invoice: true,
          },
        },
      },
    });

    if (!job) {
      console.warn(`No QuickBooksPaymentSyncJob found for requestID ${requestId}`);
      continue;
    }

    if (job.status === QBPaymentSyncStatus.SUCCESS) {
      console.log("QB PAYMENT WRITE ALREADY SUCCESS - SKIPPING:");
      console.log({
        requestId,
        jobId: job.id,
        localPaymentId: job.localPaymentId,
        qbPaymentTxnId: job.qbPaymentTxnId,
      });

      continue;
    }

    if (statusCode !== "0") {
      await prisma.quickBooksPaymentSyncJob.update({
        where: {
          qbRequestId: requestId,
        },
        data: {
          status: QBPaymentSyncStatus.FAILED,
          errorMessage:
            statusMessage ||
            `QuickBooks failed with statusCode ${statusCode}.`,
          responseJson: rawResponseXml,
        },
      });

      console.error("QB PAYMENT WRITE FAILED:");
      console.error({
        requestId,
        jobId: job.id,
        localPaymentId: job.localPaymentId,
        invoiceNumber: job.payment?.invoice?.invoiceNumber,
        invoiceId: job.payment?.customerInvoiceId,
        customerName: job.payment?.customerName,
        referenceNumber: job.payment?.referenceNumber,
        paymentAmount: String(job.payment?.amount),
        qbInvoiceTxnId: job.qbInvoiceTxnId,
        statusCode,
        statusSeverity,
        statusMessage,
      });

      continue;
    }

    const ret = addRs.ReceivePaymentRet;

    const qbPaymentTxnId = ret?.TxnID ?? null;
    const qbPaymentEditSequence = ret?.EditSequence ?? null;

    await prisma.$transaction(async (tx) => {
      await tx.quickBooksPaymentSyncJob.update({
        where: {
          qbRequestId: requestId,
        },
        data: {
          status: QBPaymentSyncStatus.SUCCESS,
          qbPaymentTxnId,
          qbPaymentEditSequence,
          responseJson: rawResponseXml,
          syncedAt: new Date(),
          errorMessage: null,
        },
      });

      if (!job.localPaymentId || !qbPaymentTxnId) {
        console.warn("QB payment write succeeded but local payment or QB TxnID is missing:");
        console.warn({
          requestId,
          jobId: job.id,
          localPaymentId: job.localPaymentId,
          qbPaymentTxnId,
        });

        return;
      }

      const payment = await tx.customerPayment.update({
        where: {
          paymentId: job.localPaymentId,
        },
        data: {
          qbTxnId: qbPaymentTxnId,
          qbEditSequence: qbPaymentEditSequence,
          lastSyncedAt: new Date(),
        },
        include: {
          invoice: true,
        },
      });

      if (!payment.invoice) {
        console.warn("QB payment write succeeded but payment has no linked invoice:");
        console.warn({
          requestId,
          jobId: job.id,
          localPaymentId: job.localPaymentId,
          qbPaymentTxnId,
        });

        return;
      }

      console.log("QB PAYMENT WRITE SUCCESS:");
      console.log({
        invoiceNumber: payment.invoice.invoiceNumber,
        invoiceId: payment.invoice.invoiceId,
        customerName: payment.invoice.customerName,
        localPaymentId: payment.paymentId,
        referenceNumber: payment.referenceNumber,
        paymentAmount: String(payment.amount),
        qbInvoiceTxnId: job.qbInvoiceTxnId,
        qbPaymentTxnId,
        qbPaymentEditSequence,
      });

      const invoiceId = payment.invoice.invoiceId;
      const totalAmount = Number(payment.invoice.totalAmount ?? 0);

      const confirmedPayments = await tx.customerPayment.findMany({
        where: {
          customerInvoiceId: invoiceId,
          qbTxnId: {
            not: null,
          },
        },
        select: {
          amount: true,
        },
      });

      const amountPaid = confirmedPayments.reduce((sum, p) => {
        return sum + Number(p.amount ?? 0);
      }, 0);

      const balanceRemaining = Math.max(totalAmount - amountPaid, 0);

      const newStatus =
        balanceRemaining <= 0
          ? CustomerInvoiceStatus.PAID
          : amountPaid > 0
            ? CustomerInvoiceStatus.PARTIALLY_PAID
            : CustomerInvoiceStatus.UNPAID;

      await tx.customerInvoice.update({
        where: {
          invoiceId,
        },
        data: {
          amountPaid,
          balanceRemaining,
          isPaid: balanceRemaining <= 0,
          status: newStatus,
          lastSyncedAt: new Date(),
        },
      });

      console.log("LOCAL INVOICE UPDATED AFTER QB SUCCESS:");
      console.log({
        invoiceNumber: payment.invoice.invoiceNumber,
        invoiceId: payment.invoice.invoiceId,
        customerName: payment.invoice.customerName,
        oldAmountPaid: String(payment.invoice.amountPaid),
        oldBalanceRemaining: String(payment.invoice.balanceRemaining),
        newAmountPaid: amountPaid,
        newBalanceRemaining: balanceRemaining,
        newStatus,
      });
    });
  }

  return true;
}