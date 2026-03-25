/*
  Warnings:

  - Made the column `invoiceItemId` on table `GoodsReceiptItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `poItemId` on table `GoodsReceiptItem` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "GoodsReceiptItem" DROP CONSTRAINT "GoodsReceiptItem_invoiceItemId_fkey";

-- DropForeignKey
ALTER TABLE "GoodsReceiptItem" DROP CONSTRAINT "GoodsReceiptItem_poItemId_fkey";

-- AlterTable
ALTER TABLE "GoodsReceiptItem" ALTER COLUMN "invoiceItemId" SET NOT NULL,
ALTER COLUMN "poItemId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_invoiceItemId_fkey" FOREIGN KEY ("invoiceItemId") REFERENCES "SupplierInvoiceItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_poItemId_fkey" FOREIGN KEY ("poItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
