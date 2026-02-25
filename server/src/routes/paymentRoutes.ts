import { must } from "../middleware/auth";
import { Router } from "express";
import { PERMS } from "@lab/shared";
import { getPaymentsHistory } from "../controllers/paymentController";

const router = Router();

router.get("/", ...must(PERMS.READ_INVOICES), getPaymentsHistory);

export default router;