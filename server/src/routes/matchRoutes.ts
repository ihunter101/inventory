import { Router } from "express";
import { must } from "../middleware/auth";
import { PERMS } from "@lab/shared";
import { createMatch, getMatchById, updateMatchStatus } from "../controllers/matchController";

const router = Router();

router.post("/", ...must(PERMS.WRITE_PURCHASE_ORDERS), createMatch);
router.get("/:id", ...must(PERMS.READ_PURCHASE_ORDERS), getMatchById);
router.patch("/:matchId", ...must(PERMS.WRITE_PURCHASE_ORDERS), updateMatchStatus);

export default router;
