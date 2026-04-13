-- CreateEnum
CREATE TYPE "InventorySourceType" AS ENUM ('GRN', 'LEGACY_IMPORT', 'OPENING_BALANCE', 'ADJUSTMENT', 'RETURN');

-- DropForeignKey
ALTER TABLE "Inventory" DROP CONSTRAINT "Inventory_supplierId_fkey";

-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "sourceReference" TEXT,
ADD COLUMN     "sourceType" "InventorySourceType" NOT NULL DEFAULT 'GRN',
ALTER COLUMN "grnItemId" DROP NOT NULL,
ALTER COLUMN "supplierId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Inventory_sourceType_idx" ON "Inventory"("sourceType");

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("supplierId") ON DELETE SET NULL ON UPDATE CASCADE;
