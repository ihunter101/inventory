// src/routes/draftProducts.ts
import { Router } from "express";
import { createDraftProduct, listDraftProducts } from "../controllers/productDraftController";
import { PERMS } from "@shared/rbac";
import { must } from "../middleware/auth";

const router = Router();
router.post("/", ...must(PERMS.WRITE_PRODUCT_DRAFT), createDraftProduct);
router.get("/", ...must(PERMS.READ_PRODUCT_DRAFT), listDraftProducts )

export default router;
