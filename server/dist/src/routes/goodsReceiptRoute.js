"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const goodsReceiptController_1 = require("../controllers/goodsReceiptController");
const router = (0, express_1.Router)();
router.get("/", goodsReceiptController_1.listGoodsReceipts);
router.post("/", goodsReceiptController_1.createGoodsReceipt);
router.post("/:id/post", goodsReceiptController_1.postGoodsReceipt);
exports.default = router;
