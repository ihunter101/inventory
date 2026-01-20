import { Router } from "express";
import { must } from "../middleware/auth";
import { PERMS } from "@shared/dist";
import { sednDocumentEmail } from "../controllers/EmailController";

const router  = Router();

router.post('/send-document', must(PERMS.WRITE_PURCHASE_ORDERS), sednDocumentEmail)

export default router