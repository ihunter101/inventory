-- CreateEnum
CREATE TYPE "ChequeDraftStatus" AS ENUM ('DRAFT', 'READY_FOR_QB', 'MATCHED', 'VOID');

-- AlterTable
ALTER TABLE "Expenses" ADD COLUMN     "chequeDraftId" TEXT;

-- CreateTable
CREATE TABLE "ChequeDraft" (
    "chequeDraftId" TEXT NOT NULL,
    "payeeName" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XCD',
    "chequeDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memo" TEXT,
    "status" "ChequeDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "chequePaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChequeDraft_pkey" PRIMARY KEY ("chequeDraftId")
);

-- CreateIndex
CREATE INDEX "ChequeDraft_payeeName_idx" ON "ChequeDraft"("payeeName");

-- CreateIndex
CREATE INDEX "ChequeDraft_status_idx" ON "ChequeDraft"("status");

-- CreateIndex
CREATE INDEX "ChequeDraft_chequeDate_idx" ON "ChequeDraft"("chequeDate");

-- CreateIndex
CREATE INDEX "ChequeDraft_chequePaymentId_idx" ON "ChequeDraft"("chequePaymentId");

-- CreateIndex
CREATE INDEX "Expenses_chequeDraftId_idx" ON "Expenses"("chequeDraftId");

-- AddForeignKey
ALTER TABLE "Expenses" ADD CONSTRAINT "Expenses_chequeDraftId_fkey" FOREIGN KEY ("chequeDraftId") REFERENCES "ChequeDraft"("chequeDraftId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChequeDraft" ADD CONSTRAINT "ChequeDraft_chequePaymentId_fkey" FOREIGN KEY ("chequePaymentId") REFERENCES "ChequePayment"("chequePaymentId") ON DELETE SET NULL ON UPDATE CASCADE;
