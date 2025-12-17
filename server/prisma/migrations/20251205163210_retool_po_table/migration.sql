/*
  Warnings:

  - Made the column `draftProductId` on table `PurchaseOrderItem` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "PurchaseOrderItem" DROP CONSTRAINT "PurchaseOrderItem_draftProductId_fkey";

-- AlterTable
ALTER TABLE "PurchaseOrderItem" ALTER COLUMN "draftProductId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_draftProductId_fkey" FOREIGN KEY ("draftProductId") REFERENCES "DraftProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
