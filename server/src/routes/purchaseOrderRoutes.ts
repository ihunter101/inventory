import { Router } from "express"
import { updatePOStatus, getPurchaseOrder, createPurchaseOrder, listPurchaseOrders } from "../controllers/purchaseOrderController"
import { must } from "../middleware/auth";
import { PERMS } from "@shared/rbac";
const router =  Router();

router.get("/", ...must(PERMS.READ_PURCHASE_ORDERS), listPurchaseOrders);
router.get("/:id", ...must(PERMS.READ_PURCHASE_ORDERS),getPurchaseOrder);
router.post("/", ...must(PERMS.WRITE_PURCHASE_ORDERS), createPurchaseOrder);
router.patch("/:id/status", ...must(PERMS.WRITE_PURCHASE_ORDERS), updatePOStatus);

export default router;