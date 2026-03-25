/*
  Warnings:

  - You are about to drop the column `lastCountedAt` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `minQuantity` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `reorderPoint` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `draftProductId` on the `PurchaseOrderItem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[invoiceId]` on the table `GoodsReceipt` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[grnItemId]` on the table `Inventory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `DraftProduct` table without a default value. This is not possible if the table is not empty.
  - Made the column `unit` on table `DraftProduct` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `lotNumber` to the `GoodsReceiptItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productDraftId` to the `GoodsReceiptItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grnItemId` to the `Inventory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lotNumber` to the `Inventory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplierId` to the `Inventory` table without a default value. This is not possible if the table is not empty.
  - Made the column `productId` on table `PurchaseOrderItem` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `draftProductId` to the `SupplierInvoiceItem` table without a default value. This is not possible if the table is not empty.
  - Made the column `id` on table `Users` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "StockRequestStatus" AS ENUM ('SUBMITTED', 'FULFILLED', 'CANCELLED', 'IN_REVIEW');

-- CreateEnum
CREATE TYPE "StockLineOutcome" AS ENUM ('PENDING', 'GRANTED', 'ADJUSTED', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('DRAFT', 'READY_TO_PAY', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PARTIALLY_PAID', 'POSTED', 'VOID');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InvoiceStatus" ADD VALUE 'READY_TO_PAY';
ALTER TYPE "InvoiceStatus" ADD VALUE 'PARTIALLY_PAID';

-- DropForeignKey
ALTER TABLE "GoodsReceipt" DROP CONSTRAINT "GoodsReceipt_poId_fkey";

-- DropForeignKey
ALTER TABLE "GoodsReceiptItem" DROP CONSTRAINT "GoodsReceiptItem_grnId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseOrderItem" DROP CONSTRAINT "PurchaseOrderItem_draftProductId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseOrderItem" DROP CONSTRAINT "PurchaseOrderItem_poId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseOrderItem" DROP CONSTRAINT "PurchaseOrderItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierInvoiceItem" DROP CONSTRAINT "SupplierInvoiceItem_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierInvoiceItem" DROP CONSTRAINT "SupplierInvoiceItem_productId_fkey";

-- DropIndex
DROP INDEX "Inventory_productId_key";

-- DropIndex
DROP INDEX "PurchaseOrderItem_draftProductId_idx";

-- AlterTable
ALTER TABLE "DraftProduct" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "unit" SET NOT NULL,
ALTER COLUMN "unit" SET DEFAULT '';

-- AlterTable
ALTER TABLE "GoodsReceipt" ALTER COLUMN "poId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "GoodsReceiptItem" ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "invoiceItemId" TEXT,
ADD COLUMN     "lotNumber" TEXT NOT NULL,
ADD COLUMN     "poItemId" TEXT,
ADD COLUMN     "productDraftId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Inventory" DROP COLUMN "lastCountedAt",
DROP COLUMN "minQuantity",
DROP COLUMN "reorderPoint",
ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "grnItemId" TEXT NOT NULL,
ADD COLUMN     "lotNumber" TEXT NOT NULL,
ADD COLUMN     "supplierId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PurchaseOrderItem" DROP COLUMN "draftProductId",
ADD COLUMN     "promotedProductId" TEXT,
ALTER COLUMN "productId" SET NOT NULL;

-- AlterTable
ALTER TABLE "SupplierInvoice" ADD COLUMN     "balanceRemaining" DECIMAL(14,2);

-- AlterTable
ALTER TABLE "SupplierInvoiceItem" ADD COLUMN     "draftProductId" TEXT NOT NULL,
ADD COLUMN     "poItemId" TEXT,
ALTER COLUMN "productId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "onboardedAt" TIMESTAMP(3),
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "lastLogin" DROP DEFAULT,
ALTER COLUMN "id" SET NOT NULL;

-- CreateTable
CREATE TABLE "Sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT NOT NULL,
    "sessionId" TEXT
);

-- CreateTable
CREATE TABLE "GrnCounter" (
    "dateKey" TEXT NOT NULL,
    "next" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrnCounter_pkey" PRIMARY KEY ("dateKey")
);

-- CreateTable
CREATE TABLE "StockLedgerAllocation" (
    "id" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "qtyAllocated" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockLedgerAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockRequest" (
    "id" TEXT NOT NULL,
    "status" "StockRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "requestedByName" TEXT NOT NULL,
    "requestedByEmail" TEXT NOT NULL,
    "requestedByLocation" "Location" NOT NULL,
    "requestedByUserId" TEXT,
    "reviewedByUserId" TEXT,
    "expectedDeliveryAt" TIMESTAMP(3),
    "messageToRequester" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockRequestLine" (
    "id" TEXT NOT NULL,
    "stockRequestId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "requestedQty" INTEGER NOT NULL,
    "grantedQty" INTEGER,
    "outcome" "StockLineOutcome" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockRequestLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreeWayMatch" (
    "id" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "grnId" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'DRAFT',
    "payableTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT DEFAULT 'EXD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThreeWayMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchLine" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "poItemId" TEXT,
    "invoiceItemId" TEXT,
    "grnLineId" TEXT,
    "name" TEXT,
    "unit" TEXT,
    "poQty" INTEGER NOT NULL DEFAULT 0,
    "grnQty" INTEGER NOT NULL DEFAULT 0,
    "invUnitPrice" DECIMAL(65,30),
    "payableQty" INTEGER NOT NULL DEFAULT 0,
    "payableAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoicePayment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "poId" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT DEFAULT 'XCD',
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT,
    "reference" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'POSTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoicePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sessions_userId_key" ON "Sessions"("userId");

-- CreateIndex
CREATE INDEX "Sessions_userId_createdAt_idx" ON "Sessions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "StockLedgerAllocation_ledgerId_idx" ON "StockLedgerAllocation"("ledgerId");

-- CreateIndex
CREATE INDEX "StockLedgerAllocation_inventoryId_idx" ON "StockLedgerAllocation"("inventoryId");

-- CreateIndex
CREATE UNIQUE INDEX "StockLedgerAllocation_ledgerId_inventoryId_key" ON "StockLedgerAllocation"("ledgerId", "inventoryId");

-- CreateIndex
CREATE INDEX "StockRequest_status_idx" ON "StockRequest"("status");

-- CreateIndex
CREATE INDEX "StockRequest_requestedByLocation_idx" ON "StockRequest"("requestedByLocation");

-- CreateIndex
CREATE INDEX "StockRequest_requestedByUserId_idx" ON "StockRequest"("requestedByUserId");

-- CreateIndex
CREATE INDEX "StockRequestLine_stockRequestId_idx" ON "StockRequestLine"("stockRequestId");

-- CreateIndex
CREATE INDEX "StockRequestLine_productId_idx" ON "StockRequestLine"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ThreeWayMatch_poId_invoiceId_grnId_key" ON "ThreeWayMatch"("poId", "invoiceId", "grnId");

-- CreateIndex
CREATE UNIQUE INDEX "ThreeWayMatch_invoiceId_key" ON "ThreeWayMatch"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "ThreeWayMatch_grnId_key" ON "ThreeWayMatch"("grnId");

-- CreateIndex
CREATE INDEX "MatchLine_matchId_idx" ON "MatchLine"("matchId");

-- CreateIndex
CREATE INDEX "InvoicePayment_poId_idx" ON "InvoicePayment"("poId");

-- CreateIndex
CREATE INDEX "InvoicePayment_paidAt_idx" ON "InvoicePayment"("paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceipt_invoiceId_key" ON "GoodsReceipt"("invoiceId");

-- CreateIndex
CREATE INDEX "GoodsReceiptItem_poItemId_idx" ON "GoodsReceiptItem"("poItemId");

-- CreateIndex
CREATE INDEX "GoodsReceiptItem_invoiceItemId_idx" ON "GoodsReceiptItem"("invoiceItemId");

-- CreateIndex
CREATE INDEX "GoodsReceiptItem_productDraftId_idx" ON "GoodsReceiptItem"("productDraftId");

-- CreateIndex
CREATE INDEX "GoodsReceiptItem_lotNumber_idx" ON "GoodsReceiptItem"("lotNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_grnItemId_key" ON "Inventory"("grnItemId");

-- CreateIndex
CREATE INDEX "Inventory_supplierId_idx" ON "Inventory"("supplierId");

-- CreateIndex
CREATE INDEX "Inventory_productId_idx" ON "Inventory"("productId");

-- CreateIndex
CREATE INDEX "Inventory_lotNumber_idx" ON "Inventory"("lotNumber");

-- CreateIndex
CREATE INDEX "Inventory_expiryDate_idx" ON "Inventory"("expiryDate");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_promotedProductId_idx" ON "PurchaseOrderItem"("promotedProductId");

-- CreateIndex
CREATE INDEX "SupplierInvoice_supplierId_idx" ON "SupplierInvoice"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierInvoiceItem_poItemId_idx" ON "SupplierInvoiceItem"("poItemId");

-- CreateIndex
CREATE INDEX "SupplierInvoiceItem_draftProductId_idx" ON "SupplierInvoiceItem"("draftProductId");

-- AddForeignKey
ALTER TABLE "Sessions" ADD CONSTRAINT "Sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("supplierId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_grnItemId_fkey" FOREIGN KEY ("grnItemId") REFERENCES "GoodsReceiptItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "DraftProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_promotedProductId_fkey" FOREIGN KEY ("promotedProductId") REFERENCES "Products"("productId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInvoiceItem" ADD CONSTRAINT "SupplierInvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "SupplierInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInvoiceItem" ADD CONSTRAINT "SupplierInvoiceItem_draftProductId_fkey" FOREIGN KEY ("draftProductId") REFERENCES "DraftProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInvoiceItem" ADD CONSTRAINT "SupplierInvoiceItem_poItemId_fkey" FOREIGN KEY ("poItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInvoiceItem" ADD CONSTRAINT "SupplierInvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"("productId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "GoodsReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_invoiceItemId_fkey" FOREIGN KEY ("invoiceItemId") REFERENCES "SupplierInvoiceItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_poItemId_fkey" FOREIGN KEY ("poItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_productDraftId_fkey" FOREIGN KEY ("productDraftId") REFERENCES "DraftProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLedgerAllocation" ADD CONSTRAINT "StockLedgerAllocation_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "StockLedger"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLedgerAllocation" ADD CONSTRAINT "StockLedgerAllocation_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockRequest" ADD CONSTRAINT "StockRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockRequest" ADD CONSTRAINT "StockRequest_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockRequestLine" ADD CONSTRAINT "StockRequestLine_stockRequestId_fkey" FOREIGN KEY ("stockRequestId") REFERENCES "StockRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockRequestLine" ADD CONSTRAINT "StockRequestLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"("productId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreeWayMatch" ADD CONSTRAINT "ThreeWayMatch_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreeWayMatch" ADD CONSTRAINT "ThreeWayMatch_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "SupplierInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreeWayMatch" ADD CONSTRAINT "ThreeWayMatch_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "GoodsReceipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchLine" ADD CONSTRAINT "MatchLine_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "ThreeWayMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "SupplierInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
