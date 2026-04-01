import { Router } from "express";
import { getExpenses, createExpense, updateExpenseStatus } from "../controllers/expenseController";
import { must } from "../middleware/auth";
import { PERMS } from "@lab/shared";

const router = Router()

router.get("/", ...must(PERMS.READ_EXPENSES), getExpenses);
router.post("/", ...must(PERMS.WRITE_EXPENSES), createExpense);
router.patch("/:expenseId/status", ...must(PERMS.WRITE_EXPENSES), updateExpenseStatus);

export default router;