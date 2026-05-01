-- CreateEnum
CREATE TYPE "ExpenseDocumentStatus" AS ENUM ('UPLOADED', 'PROCESSESING', 'AI_EXTRACTED', 'REVIEWED', 'SAVED', 'FAILED');

-- CreateTable
CREATE TABLE "ExpenseDocument" (
    "documentId" TEXT NOT NULL,
    "uploadThingKey" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "aiExtractedJson" JSONB,
    "status" "ExpenseDocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "expenseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseDocument_pkey" PRIMARY KEY ("documentId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseDocument_uploadThingKey_key" ON "ExpenseDocument"("uploadThingKey");

-- AddForeignKey
ALTER TABLE "ExpenseDocument" ADD CONSTRAINT "ExpenseDocument_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expenses"("expenseId") ON DELETE SET NULL ON UPDATE CASCADE;
