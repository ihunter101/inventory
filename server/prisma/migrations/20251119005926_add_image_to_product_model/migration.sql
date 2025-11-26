-- AlterTable
ALTER TABLE "public"."Products" ADD COLUMN     "image" TEXT;

-- CreateTable
CREATE TABLE "public"."dailySales" (
    "id" SERIAL NOT NULL,
    "locationId" INTEGER NOT NULL,
    "salesDate" TIMESTAMP(3) NOT NULL,
    "hundredsCount" INTEGER NOT NULL DEFAULT 0,
    "fiftiesCount" INTEGER NOT NULL DEFAULT 0,
    "twentiesCount" INTEGER NOT NULL DEFAULT 0,
    "tensCount" INTEGER NOT NULL DEFAULT 0,
    "fivesCount" INTEGER NOT NULL DEFAULT 0,
    "cashTotal" DECIMAL(10,2) NOT NULL,
    "grandTotal" DECIMAL(10,2) NOT NULL,
    "creditCardTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "debitCardTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "chequeTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "enteredBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dailySales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sales_audit_log" (
    "id" SERIAL NOT NULL,
    "salesId" INTEGER NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "columnName" TEXT NOT NULL,
    "oldValue" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dailySales_salesDate_idx" ON "public"."dailySales"("salesDate");

-- CreateIndex
CREATE UNIQUE INDEX "dailySales_locationId_salesDate_key" ON "public"."dailySales"("locationId", "salesDate");

-- CreateIndex
CREATE INDEX "sales_audit_log_salesId_idx" ON "public"."sales_audit_log"("salesId");

-- CreateIndex
CREATE INDEX "sales_audit_log_changedAt_idx" ON "public"."sales_audit_log"("changedAt");
