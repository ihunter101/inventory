// src/routes/draftProducts.ts
import { Router } from "express";
import { 
  bulkFinalizeProducts, 
  createDraftProduct, 
  getPendingArrivals,      // ✅ Already imported
  getPendingPromotions, 
  getPendingPromotionsCount, 
  listDraftProducts 
} from "../controllers/productDraftController";
import { PERMS } from "@lab/shared";
import { must } from "../middleware/auth";

const router = Router();
router.post("/", ...must(PERMS.WRITE_PRODUCT_DRAFT), createDraftProduct);
router.get("/", ...must(PERMS.READ_PRODUCT_DRAFT), listDraftProducts);

// ✅ ADD THIS LINE
router.get("/pending-arrivals", ...must(PERMS.WRITE_PRODUCT_DRAFT), getPendingArrivals);

router.get("/pending-promotions", ...must(PERMS.WRITE_PRODUCT_DRAFT), getPendingPromotions);
router.get("/pending-promotions/count", ...must(PERMS.WRITE_PRODUCT_DRAFT), getPendingPromotionsCount);

// ✅ ADD THIS LINE
router.post("/bulk-finalize", ...must(PERMS.READ_PRODUCT_DRAFT), bulkFinalizeProducts);

export default router;