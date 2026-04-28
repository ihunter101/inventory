-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "altContact" TEXT,
ADD COLUMN     "balance" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "customerDetail1" TEXT,
ADD COLUMN     "customerDetail2" TEXT,
ADD COLUMN     "customerDetail3" TEXT,
ADD COLUMN     "customerDetail4" TEXT,
ADD COLUMN     "customerDetail5" TEXT,
ADD COLUMN     "subClientName" TEXT,
ADD COLUMN     "termsName" TEXT,
ADD COLUMN     "totalBalance" DECIMAL(65,30) DEFAULT 0;

-- AlterTable
ALTER TABLE "CustomerInvoice" ADD COLUMN     "appliedAmount" DECIMAL(12,2),
ADD COLUMN     "arAccountName" TEXT,
ADD COLUMN     "customerDetail1" TEXT,
ADD COLUMN     "customerDetail2" TEXT,
ADD COLUMN     "customerDetail3" TEXT,
ADD COLUMN     "customerDetail4" TEXT,
ADD COLUMN     "customerDetail5" TEXT,
ADD COLUMN     "isFinanceCharge" BOOLEAN,
ADD COLUMN     "isPaid" BOOLEAN,
ADD COLUMN     "isPending" BOOLEAN,
ADD COLUMN     "isToBePrinted" BOOLEAN,
ADD COLUMN     "memo" TEXT,
ADD COLUMN     "qbTxnNumber" TEXT,
ADD COLUMN     "salesRepName" TEXT,
ADD COLUMN     "shipServiceDate" TIMESTAMP(3),
ADD COLUMN     "subClientName" TEXT,
ADD COLUMN     "taxPercentage" DECIMAL(12,2),
ADD COLUMN     "templateName" TEXT,
ADD COLUMN     "termsName" TEXT;

-- CreateTable
CREATE TABLE "CustomerInvoiceLine" (
    "lineId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "qbTxnLineId" TEXT,
    "itemListId" TEXT,
    "itemName" TEXT,
    "description" TEXT,
    "classListId" TEXT,
    "className" TEXT,
    "quantity" DECIMAL(12,2),
    "rate" DECIMAL(12,2),
    "amount" DECIMAL(12,2),
    "serviceDate" TIMESTAMP(3),
    "rawJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerInvoiceLine_pkey" PRIMARY KEY ("lineId")
);

-- CreateIndex
CREATE INDEX "CustomerInvoiceLine_invoiceId_idx" ON "CustomerInvoiceLine"("invoiceId");

-- CreateIndex
CREATE INDEX "CustomerInvoiceLine_itemName_idx" ON "CustomerInvoiceLine"("itemName");

-- CreateIndex
CREATE INDEX "CustomerInvoiceLine_className_idx" ON "CustomerInvoiceLine"("className");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerInvoiceLine_invoiceId_qbTxnLineId_key" ON "CustomerInvoiceLine"("invoiceId", "qbTxnLineId");

-- CreateIndex
CREATE INDEX "Customer_subClientName_idx" ON "Customer"("subClientName");

-- CreateIndex
CREATE INDEX "CustomerInvoice_customerName_idx" ON "CustomerInvoice"("customerName");

-- CreateIndex
CREATE INDEX "CustomerInvoice_subClientName_idx" ON "CustomerInvoice"("subClientName");

-- AddForeignKey
ALTER TABLE "CustomerInvoiceLine" ADD CONSTRAINT "CustomerInvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "CustomerInvoice"("invoiceId") ON DELETE CASCADE ON UPDATE CASCADE;
