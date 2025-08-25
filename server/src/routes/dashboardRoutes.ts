import { Router } from "express";
import { getDashbaordMetrics } from "../controllers/dashboardController";

const router = Router();

router.get("/", getDashbaordMetrics);

export default router; 