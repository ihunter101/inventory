"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/draftProducts.ts
const express_1 = require("express");
const productDraftController_1 = require("../controllers/productDraftController");
const rbac_1 = require("@shared/rbac");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post("/", ...(0, auth_1.must)(rbac_1.PERMS.WRITE_PRODUCT_DRAFT), productDraftController_1.createDraftProduct);
router.get("/", ...(0, auth_1.must)(rbac_1.PERMS.READ_PRODUCT_DRAFT), productDraftController_1.listDraftProducts);
exports.default = router;
