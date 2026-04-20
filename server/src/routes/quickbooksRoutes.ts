import { Router } from "express";
import {
  getQuickBooksCustomers,
  getQuickBooksInvoices,
  getQuickBooksPayments,
  getQuickBooksCheques,
  getQuickBooksSummary,
} from "../controllers/quickbooksController";
import { PERMS } from "@lab/shared";
import { must } from "../middleware/auth"

const router = Router();

router.get("/summary", ...must(PERMS.READ_PURCHASE_ORDERS), getQuickBooksSummary);
router.get("/customers", ...must(PERMS.READ_PURCHASE_ORDERS), getQuickBooksCustomers);
router.get("/invoices", ...must(PERMS.READ_PURCHASE_ORDERS), getQuickBooksInvoices);
router.get("/payments", ...must(PERMS.READ_PURCHASE_ORDERS),  getQuickBooksPayments);
router.get("/cheques", ...must(PERMS.READ_PURCHASE_ORDERS), getQuickBooksCheques);

export default router;