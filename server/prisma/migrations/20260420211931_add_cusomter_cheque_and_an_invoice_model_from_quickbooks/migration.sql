-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('QUICKBOOKS', 'MANUAL', 'INTERNAL');

-- CreateEnum
CREATE TYPE "CustomerInvoiceStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'CHEQUE', 'BANK_TRANSFER', 'OTHER');

-- CreateEnum
CREATE TYPE "ChequeStatus" AS ENUM ('ISSUED', 'CLEARED', 'VOID', 'UNKNOWN');

-- CreateTable
CREATE TABLE "Customer" (
    "customerId" TEXT NOT NULL,
    "qbListId" TEXT,
    "qbEditSequence" TEXT,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "source" "DataSource" NOT NULL DEFAULT 'QUICKBOOKS',
    "rawJson" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("customerId")
);

-- CreateTable
CREATE TABLE "CustomerInvoice" (
    "invoiceId" TEXT NOT NULL,
    "qbTxnId" TEXT,
    "qbEditSequence" TEXT,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "subtotal" DECIMAL(12,2),
    "taxTotal" DECIMAL(12,2),
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balanceRemaining" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "CustomerInvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "source" "DataSource" NOT NULL DEFAULT 'QUICKBOOKS',
    "rawJson" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerInvoice_pkey" PRIMARY KEY ("invoiceId")
);

-- CreateTable
CREATE TABLE "CustomerPayment" (
    "paymentId" TEXT NOT NULL,
    "qbTxnId" TEXT,
    "qbEditSequence" TEXT,
    "customerId" TEXT,
    "customerInvoiceId" TEXT,
    "customerName" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "PaymentMethod",
    "referenceNumber" TEXT,
    "notes" TEXT,
    "source" "DataSource" NOT NULL DEFAULT 'QUICKBOOKS',
    "rawJson" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerPayment_pkey" PRIMARY KEY ("paymentId")
);

-- CreateTable
CREATE TABLE "ChequePayment" (
    "chequePaymentId" TEXT NOT NULL,
    "qbTxnId" TEXT,
    "qbEditSequence" TEXT,
    "payeeName" TEXT NOT NULL,
    "chequeNumber" TEXT,
    "chequeDate" TIMESTAMP(3),
    "amount" DECIMAL(12,2) NOT NULL,
    "accountName" TEXT,
    "memo" TEXT,
    "status" "ChequeStatus" NOT NULL DEFAULT 'UNKNOWN',
    "source" "DataSource" NOT NULL DEFAULT 'QUICKBOOKS',
    "rawJson" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChequePayment_pkey" PRIMARY KEY ("chequePaymentId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_qbListId_key" ON "Customer"("qbListId");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerInvoice_qbTxnId_key" ON "CustomerInvoice"("qbTxnId");

-- CreateIndex
CREATE INDEX "CustomerInvoice_customerId_idx" ON "CustomerInvoice"("customerId");

-- CreateIndex
CREATE INDEX "CustomerInvoice_invoiceDate_idx" ON "CustomerInvoice"("invoiceDate");

-- CreateIndex
CREATE INDEX "CustomerInvoice_dueDate_idx" ON "CustomerInvoice"("dueDate");

-- CreateIndex
CREATE INDEX "CustomerInvoice_status_idx" ON "CustomerInvoice"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPayment_qbTxnId_key" ON "CustomerPayment"("qbTxnId");

-- CreateIndex
CREATE INDEX "CustomerPayment_customerId_idx" ON "CustomerPayment"("customerId");

-- CreateIndex
CREATE INDEX "CustomerPayment_customerInvoiceId_idx" ON "CustomerPayment"("customerInvoiceId");

-- CreateIndex
CREATE INDEX "CustomerPayment_paymentDate_idx" ON "CustomerPayment"("paymentDate");

-- CreateIndex
CREATE UNIQUE INDEX "ChequePayment_qbTxnId_key" ON "ChequePayment"("qbTxnId");

-- CreateIndex
CREATE INDEX "ChequePayment_payeeName_idx" ON "ChequePayment"("payeeName");

-- CreateIndex
CREATE INDEX "ChequePayment_chequeDate_idx" ON "ChequePayment"("chequeDate");

-- CreateIndex
CREATE INDEX "ChequePayment_chequeNumber_idx" ON "ChequePayment"("chequeNumber");

-- AddForeignKey
ALTER TABLE "CustomerInvoice" ADD CONSTRAINT "CustomerInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("customerId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPayment" ADD CONSTRAINT "CustomerPayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("customerId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPayment" ADD CONSTRAINT "CustomerPayment_customerInvoiceId_fkey" FOREIGN KEY ("customerInvoiceId") REFERENCES "CustomerInvoice"("invoiceId") ON DELETE SET NULL ON UPDATE CASCADE;
