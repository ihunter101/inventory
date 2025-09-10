import { Router } from "express"
import { updatePOStatus, getPurchaseOrder, createPurchaseOrder, listPurchaseOrders } from "../controllers/purchaseOrderController"
const router =  Router();

router.get("/", listPurchaseOrders);
router.get("/:id", getPurchaseOrder);
router.post("/", createPurchaseOrder);
router.patch("/:id/status", updatePOStatus);

export default router;