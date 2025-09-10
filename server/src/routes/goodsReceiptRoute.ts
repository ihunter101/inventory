
import { Router } from "express";
import { listGoodsReceipts, createGoodsReceipt, postGoodsReceipt } from "../controllers/goodsReceiptController";
const router = Router();

router.get("/", listGoodsReceipts);
router.post("/", createGoodsReceipt);
router.post("/:id/post", postGoodsReceipt);

export default router;
