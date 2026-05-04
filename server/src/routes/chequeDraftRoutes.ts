import { Router } from "express";
import { must } from "../middleware/auth";
import { PERMS } from "@lab/shared";
import {
  createChequeDraft,
  getChequeDraftById,
  getChequeDraftExpenseGroups,
  getChequeDrafts,
  voidChequeDraft,
} from "../controllers/chequeDraftController";

const router = Router();

router.get(
  "/expense-groups",
  ...must(PERMS.READ_EXPENSES),
  getChequeDraftExpenseGroups
);

router.get(
  "/",
  ...must(PERMS.READ_EXPENSES),
  getChequeDrafts
);

router.get(
  "/:chequeDraftId",
  ...must(PERMS.READ_EXPENSES),
  getChequeDraftById
);

router.post(
  "/",
  ...must(PERMS.WRITE_EXPENSES),
  createChequeDraft
);

router.patch(
  "/:chequeDraftId/void",
  ...must(PERMS.WRITE_EXPENSES),
  voidChequeDraft
);

export default router;