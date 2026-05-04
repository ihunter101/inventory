/*
  Warnings:

  - The values [PROCESSESING] on the enum `ExpenseDocumentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ExpenseDocumentStatus_new" AS ENUM ('UPLOADED', 'PROCESSING', 'AI_EXTRACTED', 'REVIEWED', 'SAVED', 'FAILED');
ALTER TABLE "public"."ExpenseDocument" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ExpenseDocument" ALTER COLUMN "status" TYPE "ExpenseDocumentStatus_new" USING ("status"::text::"ExpenseDocumentStatus_new");
ALTER TYPE "ExpenseDocumentStatus" RENAME TO "ExpenseDocumentStatus_old";
ALTER TYPE "ExpenseDocumentStatus_new" RENAME TO "ExpenseDocumentStatus";
DROP TYPE "public"."ExpenseDocumentStatus_old";
ALTER TABLE "ExpenseDocument" ALTER COLUMN "status" SET DEFAULT 'UPLOADED';
COMMIT;

-- AlterTable
ALTER TABLE "Expenses" ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'XCD',
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "expenseDate" TIMESTAMP(3),
ADD COLUMN     "invoiceNumber" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "referenceNo" TEXT,
ADD COLUMN     "vendorName" TEXT;

-- CreateIndex
CREATE INDEX "Expenses_companyName_idx" ON "Expenses"("companyName");

-- CreateIndex
CREATE INDEX "Expenses_expenseDate_idx" ON "Expenses"("expenseDate");
