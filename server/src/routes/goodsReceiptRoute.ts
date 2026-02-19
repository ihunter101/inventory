
import { Router } from "express";
import { listGoodsReceipts, createGoodsReceipt, postGoodsReceipt, getGoodReceiptById, deleteGoodsReceipt, updateGoodsReceipt } from "../controllers/goodsReceiptController";
import { must } from "../middleware/auth";
import { PERMS } from "@lab/shared";
const router = Router();

router.get("/", ...must(PERMS.READ_GRNS), listGoodsReceipts);
router.post("/", ...must(PERMS.WRITE_GRNS), createGoodsReceipt);
router.post("/:id/post", ...must(PERMS.WRITE_GRNS), postGoodsReceipt);
router.get("/:id", ...must(PERMS.READ_GRNS), getGoodReceiptById)
router.put("/:id", ...must(PERMS.WRITE_GRNS), updateGoodsReceipt); 
router.delete("/:id", ...must(PERMS.WRITE_GRNS), deleteGoodsReceipt);

export default router;
