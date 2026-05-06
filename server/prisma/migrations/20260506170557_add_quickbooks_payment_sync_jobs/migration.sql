-- CreateEnum
CREATE TYPE "QBPaymentSyncStatus" AS ENUM ('PENDING', 'SENT', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "QuickBooksPaymentSyncJob" (
    "id" TEXT NOT NULL,
    "status" "QBPaymentSyncStatus" NOT NULL DEFAULT 'PENDING',
    "localInvoiceId" TEXT NOT NULL,
    "localPaymentId" TEXT,
    "qbRequestId" TEXT NOT NULL,
    "qbCustomerListId" TEXT NOT NULL,
    "qbInvoiceTxnId" TEXT NOT NULL,
    "qbPaymentTxnId" TEXT,
    "qbPaymentEditSequence" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" TEXT,
    "referenceNumber" TEXT,
    "memo" TEXT,
    "responseJson" TEXT,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3),

    CONSTRAINT "QuickBooksPaymentSyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuickBooksPaymentSyncJob_qbRequestId_key" ON "QuickBooksPaymentSyncJob"("qbRequestId");
