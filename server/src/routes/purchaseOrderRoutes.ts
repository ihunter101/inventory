import { Router } from "express"
import { updatePOStatus, getPurchaseOrder, createPurchaseOrder, listPurchaseOrders, updatePurchaseOrder, deletePurchaseOrder } from "../controllers/purchaseOrderController"
import { must } from "../middleware/auth";
import { PERMS } from "@lab/shared";
import { resendPurchaseOrderEmail } from "../controllers/EmailController";
const router =  Router();

router.get("/", ...must(PERMS.READ_PURCHASE_ORDERS), listPurchaseOrders);
router.get("/:id", ...must(PERMS.READ_PURCHASE_ORDERS),getPurchaseOrder);
router.post("/", ...must(PERMS.WRITE_PURCHASE_ORDERS), createPurchaseOrder);
router.patch("/:id/status", ...must(PERMS.WRITE_PURCHASE_ORDERS), updatePOStatus);
router.patch("/:id", ...must(PERMS.WRITE_PURCHASE_ORDERS), updatePurchaseOrder);
router.delete("/:id", ...must(PERMS.WRITE_PURCHASE_ORDERS), deletePurchaseOrder);

//sending an email
router.post('/resend-email', ...must(PERMS.WRITE_PURCHASE_ORDERS), resendPurchaseOrderEmail);

export default router;
