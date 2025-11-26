import { Router } from "express";
import { listInvoices, createInvoice, markInvoicePaid } from "../controllers/invoiceController";
import { must } from "../middleware/auth";
import { PERMS } from "@shared/rbac";


const router = Router();

router.get("/", ...must(PERMS.READ_INVOICES), listInvoices);
// router.get("/:id", getInvoice);
router.post("/", ...must(PERMS.WRITE_INVOICES), createInvoice);
router.patch("/:id/status", ...must(PERMS.WRITE_INVOICES),markInvoicePaid);

export default router;