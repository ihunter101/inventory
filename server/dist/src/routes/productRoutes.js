"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productConrtoller_1 = require("../controllers/productConrtoller");
const router = (0, express_1.Router)();
router.get("/", productConrtoller_1.getProducts);
router.post("/", productConrtoller_1.createProduct);
exports.default = router;
