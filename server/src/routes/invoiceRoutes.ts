import { Router } from "express";
import { listInvoices, createInvoice, markInvoicePaid, updateInvoice, deleteInvoice, getInvoice } from "../controllers/invoiceController";
import { must } from "../middleware/auth";
import { PERMS } from "@lab/shared";


const router = Router();

router.get("/", ...must(PERMS.READ_INVOICES), listInvoices);
// router.get("/:id", getInvoice);
router.post("/", ...must(PERMS.WRITE_INVOICES), createInvoice);
router.patch("/:id/status", ...must(PERMS.WRITE_INVOICES),markInvoicePaid);
router.patch("/:id", ...must(PERMS.WRITE_INVOICES), updateInvoice);
router.delete("/:id", ...must(PERMS.WRITE_INVOICES), deleteInvoice);
router.get("/:id", ...must(PERMS.READ_INVOICES), getInvoice);

export default router;
