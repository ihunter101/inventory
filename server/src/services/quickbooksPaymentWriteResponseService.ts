import { parseStringPromise } from "xml2js";
import { QBPaymentSyncStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

export async function handleReceivePaymentAddResponse(rawResponseXml: string) {
  if (!rawResponseXml || !rawResponseXml.includes("ReceivePaymentAddRs")) {
    return false;
  }

  const parsed = await parseStringPromise(rawResponseXml, {
    explicitArray: false,
    ignoreAttrs: false,
  });

  const addRs = parsed?.QBXML?.QBXMLMsgsRs?.ReceivePaymentAddRs;

  if (!addRs) return false;

  const requestId = addRs?.$?.requestID;
  const statusCode = addRs?.$?.statusCode;
  const statusMessage = addRs?.$?.statusMessage;

  if (!requestId) {
    console.warn("ReceivePaymentAddRs returned without requestID.");
    return true;
  }

  const job = await prisma.quickBooksPaymentSyncJob.findUnique({
    where: {
      qbRequestId: requestId,
    },
  });

  if (!job) {
    console.warn(`No QuickBooksPaymentSyncJob found for requestID ${requestId}`);
    return true;
  }

  if (statusCode !== "0") {
    await prisma.quickBooksPaymentSyncJob.update({
      where: {
        qbRequestId: requestId,
      },
      data: {
        status: QBPaymentSyncStatus.FAILED,
        errorMessage: statusMessage || "QuickBooks ReceivePaymentAdd failed.",
        responseJson: rawResponseXml,
      },
    });

    return true;
  }

  const ret = addRs.ReceivePaymentRet;

  const qbPaymentTxnId = ret?.TxnID ?? null;
  const qbPaymentEditSequence = ret?.EditSequence ?? null;

  await prisma.quickBooksPaymentSyncJob.update({
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

  if (job.localPaymentId && qbPaymentTxnId) {
    await prisma.customerPayment.update({
      where: {
        paymentId: job.localPaymentId,
      },
      data: {
        qbTxnId: qbPaymentTxnId,
        qbEditSequence: qbPaymentEditSequence,
        lastSyncedAt: new Date(),
      },
    });
  }

  return true;
}