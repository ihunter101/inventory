import { Router } from "express"
import { getQuarterlyAISummary } from "../controllers/aiController";
import { must } from "../middleware/auth";
import { PERMS } from "@lab/shared";

const router = Router();


router.post("/quaterly-summary", ...must(PERMS.READ_PURCHASE_ORDERS), getQuarterlyAISummary);

export default router