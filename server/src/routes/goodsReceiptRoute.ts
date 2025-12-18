
import { Router } from "express";
import { listGoodsReceipts, createGoodsReceipt, postGoodsReceipt } from "../controllers/goodsReceiptController";
import { must } from "../middleware/auth";
import { PERMS } from "@lab/shared";
const router = Router();

router.get("/", ...must(PERMS.READ_GRNS), listGoodsReceipts);
router.post("/", ...must(PERMS.WRITE_GRNS), createGoodsReceipt);
router.post("/:id/post", ...must(PERMS.WRITE_GRNS), postGoodsReceipt);

export default router;
