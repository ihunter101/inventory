import { Router } from "express";
import { listInvoices, createInvoice, markInvoicePaid, updateInvoice, deleteInvoice, getInvoice } from "../controllers/invoiceController";
import { must } from "../middleware/auth";
import { PERMS } from "@lab/shared";
import { createInvoicePayment, getInvoicePayments, getInvoicePaymentSummary } from "../controllers/paymentController";


const router = Router();

router.get("/", ...must(PERMS.READ_INVOICES), listInvoices);
// router.get("/:id", getInvoice);
router.post("/", ...must(PERMS.WRITE_INVOICES), createInvoice);

//imported from a separate but related controller
router.post("/:id/payments", ...must(PERMS.WRITE_INVOICES), createInvoicePayment)

router.patch("/:id/status", ...must(PERMS.WRITE_INVOICES),markInvoicePaid);
router.patch("/:id/status", ...must(PERMS.WRITE_INVOICES),markInvoicePaid);
router.patch("/:id", ...must(PERMS.WRITE_INVOICES), updateInvoice);

router.delete("/:id", ...must(PERMS.WRITE_INVOICES), deleteInvoice);
router.get("/:id", ...must(PERMS.READ_INVOICES), getInvoice);
router.get("/:id/payments", ...must(PERMS.READ_INVOICES), getInvoicePayments)

//imported form a separate controller 
router.get("/:id/payment-summary", ...must(PERMS.READ_INVOICES), getInvoicePaymentSummary)

export default router;
