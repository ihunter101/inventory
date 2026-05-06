/*
  Warnings:

  - You are about to drop the column `amount` on the `QuickBooksPaymentSyncJob` table. All the data in the column will be lost.
  - You are about to drop the column `localInvoiceId` on the `QuickBooksPaymentSyncJob` table. All the data in the column will be lost.
  - You are about to drop the column `memo` on the `QuickBooksPaymentSyncJob` table. All the data in the column will be lost.
  - You are about to drop the column `paymentDate` on the `QuickBooksPaymentSyncJob` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `QuickBooksPaymentSyncJob` table. All the data in the column will be lost.
  - You are about to drop the column `referenceNumber` on the `QuickBooksPaymentSyncJob` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[localPaymentId]` on the table `QuickBooksPaymentSyncJob` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "QuickBooksPaymentSyncJob" DROP COLUMN "amount",
DROP COLUMN "localInvoiceId",
DROP COLUMN "memo",
DROP COLUMN "paymentDate",
DROP COLUMN "paymentMethod",
DROP COLUMN "referenceNumber";

-- CreateIndex
CREATE UNIQUE INDEX "QuickBooksPaymentSyncJob_localPaymentId_key" ON "QuickBooksPaymentSyncJob"("localPaymentId");

-- AddForeignKey
ALTER TABLE "QuickBooksPaymentSyncJob" ADD CONSTRAINT "QuickBooksPaymentSyncJob_localPaymentId_fkey" FOREIGN KEY ("localPaymentId") REFERENCES "CustomerPayment"("paymentId") ON DELETE CASCADE ON UPDATE CASCADE;
