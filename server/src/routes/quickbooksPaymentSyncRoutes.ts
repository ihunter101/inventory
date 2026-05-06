import { Router } from "express";
import {
  queueQuickBooksInvoicePayment,
  getQuickBooksPaymentSyncJobs,
  retryQuickBooksPaymentSyncJob,
  batchMarkInvoicesPaidForQuickBooks,
} from "../controllers/quickbooksPaymentSyncController";
import { must } from "../middleware/auth";
import { PERMS } from "@lab/shared";

const router = Router();

router.post(
  "/invoices/:invoiceId/payments",
  ...must(PERMS.WRITE_INVOICES), //change to WRITE_QUICKBOOKS
  queueQuickBooksInvoicePayment
);
router.post(
  "/invoices/batch-mark-paid",
  ...must(PERMS.WRITE_INVOICES),
  batchMarkInvoicesPaidForQuickBooks
);

router.get(
  "/jobs",
  ...must(PERMS.READ_INVOICES),
  getQuickBooksPaymentSyncJobs
);

router.patch(
  "/jobs/:jobId/retry",
  ...must(PERMS.WRITE_INVOICES),
  retryQuickBooksPaymentSyncJob
);

export default router;