-- DropForeignKey
ALTER TABLE "GoodsReceiptItem" DROP CONSTRAINT "GoodsReceiptItem_productId_fkey";

-- AlterTable
ALTER TABLE "GoodsReceiptItem" ALTER COLUMN "productId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"("productId") ON DELETE SET NULL ON UPDATE CASCADE;
