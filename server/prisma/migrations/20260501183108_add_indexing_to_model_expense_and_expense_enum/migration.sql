-- CreateIndex
CREATE INDEX "ExpenseDocument_status_idx" ON "ExpenseDocument"("status");

-- CreateIndex
CREATE INDEX "ExpenseDocument_expenseId_idx" ON "ExpenseDocument"("expenseId");

-- CreateIndex
CREATE INDEX "ExpenseDocument_createdAt_idx" ON "ExpenseDocument"("createdAt");

-- CreateIndex
CREATE INDEX "ExpenseDocument_status_createdAt_idx" ON "ExpenseDocument"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Expenses_status_idx" ON "Expenses"("status");

-- CreateIndex
CREATE INDEX "Expenses_group_idx" ON "Expenses"("group");

-- CreateIndex
CREATE INDEX "Expenses_category_idx" ON "Expenses"("category");

-- CreateIndex
CREATE INDEX "Expenses_createdAt_idx" ON "Expenses"("createdAt");

-- CreateIndex
CREATE INDEX "Expenses_status_createdAt_idx" ON "Expenses"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Expenses_group_createdAt_idx" ON "Expenses"("group", "createdAt");
