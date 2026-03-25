/*
  Warnings:

  - The values [RodneyBay] on the enum `Location` will be removed. If these variants are still used in the database, this will fail.
  - The `status` column on the `Expenses` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `Expenses` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'VOID');

-- AlterEnum
BEGIN;
CREATE TYPE "Location_new" AS ENUM ('Tapion', 'blueCoral', 'manoelStreet', 'sunnyAcres', 'emCare', 'rodneyBay', 'memberCare', 'vieuxFort', 'soufriere', 'other');
ALTER TABLE "public"."Users" ALTER COLUMN "location" DROP DEFAULT;
ALTER TABLE "Users" ALTER COLUMN "location" TYPE "Location_new" USING ("location"::text::"Location_new");
ALTER TABLE "StockRequest" ALTER COLUMN "requestedByLocation" TYPE "Location_new" USING ("requestedByLocation"::text::"Location_new");
ALTER TYPE "Location" RENAME TO "Location_old";
ALTER TYPE "Location_new" RENAME TO "Location";
DROP TYPE "public"."Location_old";
ALTER TABLE "Users" ALTER COLUMN "location" SET DEFAULT 'Tapion';
COMMIT;

-- AlterTable
ALTER TABLE "Expenses" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING';
