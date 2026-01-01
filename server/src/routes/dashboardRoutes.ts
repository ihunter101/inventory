import { Router } from "express";
import { getDashbaordMetrics } from "../controllers/dashboardController";
import { must } from "../middleware/auth";
import { PERMS } from "@shared/dist";

const router = Router();

router.get("/",...must(PERMS.VIEW_DASHBOARD), getDashbaordMetrics);

export default router; 
