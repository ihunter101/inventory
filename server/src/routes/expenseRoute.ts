import { Router } from "express";
import { getExpenses, createExpense, updateExpenseStatus, getExpenseById } from "../controllers/expenseController";
import { must } from "../middleware/auth";
import { PERMS } from "@lab/shared";

const router = Router()

router.get("/", ...must(PERMS.READ_EXPENSES), getExpenses);
router.get("/:expenseId", ...must(PERMS.READ_EXPENSES), getExpenseById);
router.post("/", ...must(PERMS.WRITE_EXPENSES), createExpense);
router.patch("/:expenseId/status", ...must(PERMS.WRITE_EXPENSES), updateExpenseStatus);

export default router;