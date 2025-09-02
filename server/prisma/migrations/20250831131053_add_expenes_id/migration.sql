/*
  Warnings:

  - You are about to drop the column `timestamp` on the `Expenses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Expenses" DROP COLUMN "timestamp",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
