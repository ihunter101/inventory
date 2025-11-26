/*
  Warnings:

  - A unique constraint covering the columns `[clerkId]` on the table `Users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Products" ALTER COLUMN "createdAt" DROP NOT NULL,
ALTER COLUMN "sku" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Users" ADD COLUMN     "clerkId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Users_clerkId_key" ON "public"."Users"("clerkId");
