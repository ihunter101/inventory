// routes/inventoryRoutes.ts
import { Router } from "express";
import { PERMS } from "@lab/shared";
import { must } from "../middleware/auth";
import {
  adjustInventory,
  getInventory,
  getInventoryWithoutExpiry,
  setInventory,
  updateInventoryMeta,
} from "../controllers/inventoryController";

const router = Router();

router.get("/", ...must(PERMS.READ_INVENTORY), getInventory);
router.get("/expiry", ...must(PERMS.READ_INVENTORY), getInventoryWithoutExpiry);

// ✅ Update expiry + thresholds
router.patch(
  "/:productId/meta",
  ...must(PERMS.WRITE_INVENTORY),
  updateInventoryMeta
);

router.post("/set", ...must(PERMS.WRITE_INVENTORY), setInventory);
router.post("/adjust", ...must(PERMS.WRITE_INVENTORY), adjustInventory);

export default router;
