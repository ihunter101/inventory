import { Router } from "express";
import { must } from "../middleware/auth";
import { PERMS } from "@lab/shared";
import { createStockSheet, fulfillStockRequest, getStockRequestById, listStockRequest, reviewStockRequest } from '../controllers/stockSheetController'

const router = Router();

router.post("/", ...must(PERMS.WRITE_STOCK_SHEET), createStockSheet);
router.get("/", ...must(PERMS.READ_STOCK_SHEET), listStockRequest);
router.get("/:id", ...must(PERMS.READ_STOCK_SHEET), getStockRequestById);
router.patch("/:id/review",...must(PERMS.WRITE_STOCK_SHEET), reviewStockRequest);
router.post("/:id/fulfill", ...must(PERMS.WRITE_STOCK_SHEET), fulfillStockRequest)

export default router;
