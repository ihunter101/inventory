"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supplierController_1 = require("../controllers/supplierController");
const router = (0, express_1.Router)();
router.get("/", supplierController_1.getSuppliers);
exports.default = router;
