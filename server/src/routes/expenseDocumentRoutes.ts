import { Router } from "express";
import { must } from "../middleware/auth";
import { PERMS } from "@lab/shared";
import {
  createExpenseDocument,
  extractExpenseDocument,
  getExpenseDocumentById,
  saveExpenseDocument,
} from "../controllers/expenseDocumentController";

const router = Router();

router.post(
  "/",
  ...must(PERMS.WRITE_EXPENSES),
  createExpenseDocument
);

router.get(
  "/:documentId",
  ...must(PERMS.READ_EXPENSES),
  getExpenseDocumentById
);

router.post(
  "/:documentId/extract",
  ...must(PERMS.WRITE_EXPENSES),
  extractExpenseDocument
);

router.post(
  "/:documentId/save-expense",
  ...must(PERMS.WRITE_EXPENSES),
  saveExpenseDocument
);

export default router;