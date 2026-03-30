/*
  Warnings:

  - You are about to drop the column `date` on the `Expenses` table. All the data in the column will be lost.
  - You are about to drop the column `group` on the `Expenses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Expenses" DROP COLUMN "date",
DROP COLUMN "group";
