import { parseStringPromise } from "xml2js";
import { QBPaymentSyncStatus } from "@prisma/client";
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

  if (addResponses.length === 0) return false;

  for (const addRs of addResponses) {
    const requestId = addRs?.$?.requestID;
    const statusCode = String(addRs?.$?.statusCode ?? "");
    const statusMessage = addRs?.$?.statusMessage;

    if (!requestId) {
      console.warn("ReceivePaymentAddRs returned without requestID.");
      continue;
    }

    const job = await prisma.quickBooksPaymentSyncJob.findUnique({
      where: {
        qbRequestId: requestId,
      },
    });

    if (!job) {
      console.warn(`No QuickBooksPaymentSyncJob found for requestID ${requestId}`);
      continue;
    }

    if (statusCode !== "0") {
      await prisma.quickBooksPaymentSyncJob.update({
        where: {
          qbRequestId: requestId,
        },
        data: {
          status: QBPaymentSyncStatus.FAILED,
          errorMessage: statusMessage || `QuickBooks failed with statusCode ${statusCode}.`,
          responseJson: rawResponseXml,
        },
      });

      continue;
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
  }

  return true;
}