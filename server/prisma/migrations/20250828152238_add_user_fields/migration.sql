/*
  Warnings:

  - The primary key for the `Users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `userId` column on the `Users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[email]` on the table `Users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'inventoryClerk', 'labStaff', 'orderAgent', 'viewer');

-- CreateEnum
CREATE TYPE "Location" AS ENUM ('Tapion', 'blueCoral', 'manoelStreet', 'sunnyAcres', 'emCare', 'RodneyBay', 'memberCare', 'vieuxFort', 'soufriere', 'other');

-- AlterTable
ALTER TABLE "Users" DROP CONSTRAINT "Users_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastLogin" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "location" "Location" NOT NULL DEFAULT 'Tapion',
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'viewer',
DROP COLUMN "userId",
ADD COLUMN     "userId" SERIAL NOT NULL,
ADD CONSTRAINT "Users_pkey" PRIMARY KEY ("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");
