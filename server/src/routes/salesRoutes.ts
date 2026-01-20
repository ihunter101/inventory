import Router from "express";
import { must } from "../middleware/auth";
import { PERMS } from "@lab/shared";
import { createSale, deleteSale, getSalesAnalytics, getSalesByLocation, getTodaySale, updateSale } from "../controllers/salesController";

const router = Router();

router.post("/", ...must(PERMS.WRITE_SALES), createSale);
router.patch("/:id",...must(PERMS.WRITE_SALES), updateSale);
router.get("/today", ...must(PERMS.READ_SALES), getTodaySale);
//router.get("/location/:locationId", ...must(PERMS.READ_SALES), getSalesByLocation);
router.get("/location", ...must(PERMS.READ_SALES), getSalesByLocation);

// Admin-only routes
router.get("/analytics", ...must(PERMS.READ_SALES), getSalesAnalytics);
router.delete("/:id", ...must(PERMS.WRITE_SALES), deleteSale);

export default router;