-- CreateEnum
CREATE TYPE "QBInvoiceSyncStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "QuickBooksInvoiceSyncJob" (
    "id" TEXT NOT NULL,
    "localInvoiceId" TEXT NOT NULL,
    "qbRequestId" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "status" "QBInvoiceSyncStatus" NOT NULL DEFAULT 'PENDING',
    "qbInvoiceTxnId" TEXT,
    "qbInvoiceEditSequence" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "requestXml" TEXT,
    "responseJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuickBooksInvoiceSyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuickBooksInvoiceSyncJob_qbRequestId_key" ON "QuickBooksInvoiceSyncJob"("qbRequestId");

-- CreateIndex
CREATE INDEX "QuickBooksInvoiceSyncJob_status_idx" ON "QuickBooksInvoiceSyncJob"("status");

-- CreateIndex
CREATE INDEX "QuickBooksInvoiceSyncJob_localInvoiceId_idx" ON "QuickBooksInvoiceSyncJob"("localInvoiceId");

-- CreateIndex
CREATE INDEX "QuickBooksInvoiceSyncJob_createdAt_idx" ON "QuickBooksInvoiceSyncJob"("createdAt");
