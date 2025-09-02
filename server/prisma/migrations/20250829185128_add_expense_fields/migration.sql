-- AlterTable
ALTER TABLE "public"."Expenses" ADD COLUMN     "description" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending';
