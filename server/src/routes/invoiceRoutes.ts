import { Router } from "express";
import { listInvoices, createInvoice, markInvoicePaid } from "../controllers/invoiceController";


const router = Router();

router.get("/", listInvoices);
// router.get("/:id", getInvoice);
router.post("/", createInvoice);
router.patch("/:id/status", markInvoicePaid);

export default router;