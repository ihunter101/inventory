/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `Users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."SourceType" AS ENUM ('GRN', 'ADJUSTMENT', 'STOCKTAKE', 'CORRECTION');

-- AlterTable
ALTER TABLE "public"."StockLedger" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "StockLedger_userId_idx" ON "public"."StockLedger"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Users_id_key" ON "public"."Users"("id");

-- AddForeignKey
ALTER TABLE "public"."StockLedger" ADD CONSTRAINT "StockLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
