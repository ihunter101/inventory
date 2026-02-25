import { Router } from "express";
import { getDashboardMetrics, getProcurementOverview, getDashboardPurchaseSummary, getSalesOverview } from "../controllers/dashboardController";
import { must } from "../middleware/auth";
import { PERMS } from "@shared/dist";

const router = Router();

router.get("/",...must(PERMS.VIEW_DASHBOARD), getDashboardMetrics);
router.get("/sales-overview", ...must(PERMS.VIEW_DASHBOARD), getSalesOverview);
router.get("/purchase-summary",...must(PERMS.VIEW_DASHBOARD), getDashboardPurchaseSummary )
router.get("/procurement-overview", ...must(PERMS.VIEW_DASHBOARD), getProcurementOverview);

export default router; 
