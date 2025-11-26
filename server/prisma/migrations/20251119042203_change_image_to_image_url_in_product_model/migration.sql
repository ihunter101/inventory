/*
  Warnings:

  - You are about to drop the column `image` on the `Products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Products" DROP COLUMN "image",
ADD COLUMN     "imageUrl" TEXT;
