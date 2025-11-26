-- CreateEnum
CREATE TYPE "public"."Department" AS ENUM ('Administration', 'SpecimenCollection', 'heamatology', 'Chemistry', 'Offlines', 'Cytology', 'Bacteriology', 'SpecialChemistry');

-- AlterTable
ALTER TABLE "public"."Products" ADD COLUMN     "Department" TEXT;
