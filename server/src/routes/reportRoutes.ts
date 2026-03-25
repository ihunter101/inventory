import { Router } from "express";
import { getQuarterlyReport } from "../controllers/reportController";
import { must } from "../middleware/auth";
import { PERMS } from "@lab/shared";

const router = Router();

router.get("/quarterly", ...must(PERMS.READ_PURCHASE_ORDERS), getQuarterlyReport);

export default router;
