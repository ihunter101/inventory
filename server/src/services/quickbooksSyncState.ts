import { prisma } from "../lib/prisma";

export type QuickBooksEntity =
  | "customers"
  | "invoices"
  | "receivePayments"
  | "checks";

export async function getSyncState(entity: QuickBooksEntity) {
  return prisma.quickBooksSyncState.upsert({
    where: { entity },
    update: {},
    create: { entity },
  });
}

export async function markFullBackfillComplete(entity: QuickBooksEntity) {
  return prisma.quickBooksSyncState.upsert({
    where: { entity },
    update: {
      fullBackfillComplete: true,
      lastModifiedSyncAt: new Date(),
    },
    create: {
      entity,
      fullBackfillComplete: true,
      lastModifiedSyncAt: new Date(),
    },
  });
}

export async function updateLastModifiedSyncAt(
  entity: QuickBooksEntity,
  date = new Date()
) {
  return prisma.quickBooksSyncState.upsert({
    where: { entity },
    update: {
      lastModifiedSyncAt: date,
    },
    create: {
      entity,
      fullBackfillComplete: false,
      lastModifiedSyncAt: date,
    },
  });
}