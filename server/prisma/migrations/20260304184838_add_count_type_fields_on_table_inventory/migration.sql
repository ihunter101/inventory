-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN     "lastCountedAt" TIMESTAMP(3),
ADD COLUMN     "minQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reorderPoint" INTEGER NOT NULL DEFAULT 0;
