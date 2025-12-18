import { Router } from "express";
import { PERMS } from "@lab/shared";
import { must } from "../middleware/auth";

import { adjustInventory, getInventory, setInventory } from "../controllers/inventoryController";

const router = Router();


router.get('/', ...must(PERMS.READ_INVENTORY), getInventory);
router.post('/set', ...must(PERMS.WRITE_INVENTORY),setInventory )
router.post("/adjust", ...must(PERMS.WRITE_INVENTORY), adjustInventory)

export default router
