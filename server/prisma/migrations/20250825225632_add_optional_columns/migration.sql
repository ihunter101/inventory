-- AlterTable
ALTER TABLE "Products" ADD COLUMN     "category" TEXT,
ADD COLUMN     "minQuantity" INTEGER DEFAULT 0,
ADD COLUMN     "reorderPoint" INTEGER;
