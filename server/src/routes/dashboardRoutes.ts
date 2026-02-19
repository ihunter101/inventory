import { Router } from "express";
import { getDashboardMetrics } from "../controllers/dashboardController";
import { must } from "../middleware/auth";
import { PERMS } from "@shared/dist";

const router = Router();

router.get("/",...must(PERMS.VIEW_DASHBOARD), getDashboardMetrics);

export default router; 
