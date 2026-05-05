import { Router } from "express";
import {
  getQuickBooksCustomers,
  getQuickBooksInvoices,
  getQuickBooksPayments,
  getQuickBooksCheques,
  getQuickBooksSummary,
  getQuickBooksInvoiceById,
  getQuickBooksCustomerById,
  forceQuickBooksInvoiceBackfill,
} from "../controllers/quickbooksController";
import { PERMS } from "@lab/shared";
import { must } from "../middleware/auth"

const router = Router();

router.get("/summary", ...must(PERMS.READ_PURCHASE_ORDERS), getQuickBooksSummary);

router.get("/customers", ...must(PERMS.READ_PURCHASE_ORDERS), getQuickBooksCustomers);
router.get("/customers/:customerId", getQuickBooksCustomerById);

router.get("/invoices", ...must(PERMS.READ_PURCHASE_ORDERS), getQuickBooksInvoices);
router.get("/invoices/:invoiceId", ...must(PERMS.READ_PURCHASE_ORDERS), getQuickBooksInvoiceById);
router.post("/invoices/force-backfill", ...must(PERMS.READ_PURCHASE_ORDERS), forceQuickBooksInvoiceBackfill);

router.get("/payments", ...must(PERMS.READ_PURCHASE_ORDERS),  getQuickBooksPayments);
router.get("/cheques", ...must(PERMS.READ_PURCHASE_ORDERS), getQuickBooksCheques);

export default router;