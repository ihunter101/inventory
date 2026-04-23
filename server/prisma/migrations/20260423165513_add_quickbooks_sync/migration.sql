-- CreateTable
CREATE TABLE "QuickBooksSyncState" (
    "entity" TEXT NOT NULL,
    "fullBackfillComplete" BOOLEAN NOT NULL DEFAULT false,
    "lastModifiedSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuickBooksSyncState_pkey" PRIMARY KEY ("entity")
);
