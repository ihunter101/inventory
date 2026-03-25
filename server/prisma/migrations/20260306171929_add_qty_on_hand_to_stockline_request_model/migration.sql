/*
  Warnings:

  - Added the required column `qtyOnHandAtRequest` to the `StockRequestLine` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StockRequestLine" ADD COLUMN     "qtyOnHandAtRequest" INTEGER NOT NULL;
