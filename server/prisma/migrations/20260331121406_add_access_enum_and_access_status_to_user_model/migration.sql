-- CreateEnum
CREATE TYPE "AccessStatus" AS ENUM ('pending', 'granted', 'denied');

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "accessStatus" "AccessStatus" NOT NULL DEFAULT 'pending';
