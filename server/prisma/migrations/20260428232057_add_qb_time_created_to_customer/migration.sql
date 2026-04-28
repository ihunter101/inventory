-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "qbTimeCreated" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Customer_qbTimeCreated_idx" ON "Customer"("qbTimeCreated");
