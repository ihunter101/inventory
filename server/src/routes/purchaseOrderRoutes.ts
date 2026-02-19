import { Router } from "express";
import {
  updatePOStatus,
  getPurchaseOrder,          // <-- pick ONE of these two
  // getPurchaseOrderById,    // <-- pick ONE of these two
  createPurchaseOrder,
  listPurchaseOrders,
  updatePurchaseOrder,
  deletePurchaseOrder,
} from "../controllers/purchaseOrderController";
import { must } from "../middleware/auth";
import { PERMS } from "@lab/shared";
import { resendPurchaseOrderEmail } from "../controllers/EmailController";
import { getAllPoPaymentSummary, getPoPaymentsSummary } from "../controllers/matchController";

const router = Router();

/** ✅ STATIC ROUTES FIRST */
router.get("/payments-summary", ...must(PERMS.READ_PURCHASE_ORDERS), getAllPoPaymentSummary);
router.post("/resend-email", ...must(PERMS.WRITE_PURCHASE_ORDERS), resendPurchaseOrderEmail);

/** ✅ COLLECTION ROUTES */
router.get("/", ...must(PERMS.READ_PURCHASE_ORDERS), listPurchaseOrders);
router.post("/", ...must(PERMS.WRITE_PURCHASE_ORDERS), createPurchaseOrder);

/** ✅ PARAM + SUBROUTES (MORE SPECIFIC BEFORE LESS SPECIFIC) */
router.get("/:id/payment-summary", ...must(PERMS.READ_PURCHASE_ORDERS), getPoPaymentsSummary);
router.patch("/:id/status", ...must(PERMS.WRITE_PURCHASE_ORDERS), updatePOStatus);
router.patch("/:id", ...must(PERMS.WRITE_PURCHASE_ORDERS), updatePurchaseOrder);
router.delete("/:id", ...must(PERMS.WRITE_PURCHASE_ORDERS), deletePurchaseOrder);

/** ✅ PARAM ROUTE LAST */
router.get("/:id", ...must(PERMS.READ_PURCHASE_ORDERS), getPurchaseOrder); // or getPurchaseOrderById

export default router;
