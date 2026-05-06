import { Request, Response } from "express";
import {
  createQuickBooksPaymentSyncJob,
  listQuickBooksPaymentSyncJobs,
  retryQuickBooksPaymentSyncJobById,
  batchCreateQuickBooksPaymentSyncJobs,
} from "../services/quickbooksPaymentSyncService";
import { PaymentMethod } from "@prisma/client";

export async function queueQuickBooksInvoicePayment(req: Request, res: Response) {
  try {
    const { invoiceId } = req.params;

    const {
      amount,
      paymentDate,
      paymentMethod,
      referenceNumber,
      memo,
    } = req.body;

    if (!invoiceId) {
      return res.status(400).json({ message: "Invoice ID is required." });
    }

    const paymentAmount = Number(amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({
        message: "Payment amount must be greater than 0.",
      });
    }

    if (!paymentDate) {
      return res.status(400).json({
        message: "Payment date is required.",
      });
    }

    const result = await createQuickBooksPaymentSyncJob({
      invoiceId,
      amount: paymentAmount,
      paymentDate,
      paymentMethod,
      referenceNumber,
      memo,
    });

    return res.status(201).json({
      message: "Payment recorded and queued for QuickBooks sync.",
      data: result,
    });
  } catch (error: any) {
    console.error("Failed to queue QuickBooks payment sync:", error);

    return res.status(500).json({
      message: error.message || "Failed to queue QuickBooks payment sync.",
    });
  }
}

export async function getQuickBooksPaymentSyncJobs(req: Request, res: Response) {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;

    const jobs = await listQuickBooksPaymentSyncJobs({ status });

    return res.json({ jobs });
  } catch (error: any) {
    console.error("Failed to fetch QuickBooks payment sync jobs:", error);

    return res.status(500).json({
      message: "Failed to fetch QuickBooks payment sync jobs.",
    });
  }
}

export async function retryQuickBooksPaymentSyncJob(req: Request, res: Response) {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({ message: "Job ID is required." });
    }

    const job = await retryQuickBooksPaymentSyncJobById(jobId);

    return res.json({
      message: "QuickBooks payment sync job queued for retry.",
      job,
    });
  } catch (error: any) {
    console.error("Failed to retry QuickBooks payment sync job:", error);

    return res.status(500).json({
      message: error.message || "Failed to retry QuickBooks payment sync job.",
    });
  }
}



export async function batchMarkInvoicesPaidForQuickBooks(req: Request, res: Response) {
  try {
    const {
      startDate,
      endDate,
      paymentDate,
      paymentMethod,
      referencePrefix,
      memo,
      dryRun,
      customerId,
      customerSearch,
    } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "startDate and endDate are required.",
      });
    }

    const result = await batchCreateQuickBooksPaymentSyncJobs({
      startDate,
      endDate,
      paymentDate: paymentDate || new Date().toISOString(),
      paymentMethod: paymentMethod || PaymentMethod.CHEQUE,
      referencePrefix,
      memo,
      dryRun: Boolean(dryRun),
      customerId,
      customerSearch,
    });

    return res.status(201).json({
      message: dryRun
        ? "Batch preview generated. No invoices were changed."
        : "Invoices marked paid locally and queued for QuickBooks sync.",
      data: result,
    });
  } catch (error: any) {
    console.error("Failed to batch mark invoices paid:", error);

    return res.status(500).json({
      message: error.message || "Failed to batch mark invoices paid.",
    });
  }
}