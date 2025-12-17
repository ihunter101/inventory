"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const purchaseOrderController_1 = require("../controllers/purchaseOrderController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("@shared/rbac");
const EmailController_1 = require("../controllers/EmailController");
const router = (0, express_1.Router)();
router.get("/", ...(0, auth_1.must)(rbac_1.PERMS.READ_PURCHASE_ORDERS), purchaseOrderController_1.listPurchaseOrders);
router.get("/:id", ...(0, auth_1.must)(rbac_1.PERMS.READ_PURCHASE_ORDERS), purchaseOrderController_1.getPurchaseOrder);
router.post("/", ...(0, auth_1.must)(rbac_1.PERMS.WRITE_PURCHASE_ORDERS), purchaseOrderController_1.createPurchaseOrder);
router.patch("/:id/status", ...(0, auth_1.must)(rbac_1.PERMS.WRITE_PURCHASE_ORDERS), purchaseOrderController_1.updatePOStatus);
router.patch("/:id", ...(0, auth_1.must)(rbac_1.PERMS.WRITE_PURCHASE_ORDERS), purchaseOrderController_1.updatePurchaseOrder);
router.delete("/:id", ...(0, auth_1.must)(rbac_1.PERMS.WRITE_PURCHASE_ORDERS), purchaseOrderController_1.deletePurchaseOrder);
//sending an email
router.post('/resend-email', ...(0, auth_1.must)(rbac_1.PERMS.WRITE_PURCHASE_ORDERS), EmailController_1.resendPurchaseOrderEmail);
exports.default = router;
