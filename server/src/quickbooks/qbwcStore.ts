// server/src/quickbooks/qbwcStore.ts

export type SyncStage =
  | "paymentWrites"
  | "customers"
  | "invoices"
  | "receivePayments"
  | "checks"
  | "done";

export type QuerySyncStage = Exclude<SyncStage, "paymentWrites" | "done">;

type IteratorState = {
  iteratorID: string | null;
  remainingCount: number;
};

export interface QBWCSession {
  token: string;
  stage: SyncStage;

  /**
   * Fixed timestamp captured when this QBWC run starts.
   *
   * We use this as the safe checkpoint when updating lastModifiedSyncAt.
   * Do NOT use new Date() at the end of the sync, because records changed
   * during the sync window could be skipped on the next incremental run.
   */
  syncStartedAt: Date;

  /**
   * Iterators only apply to QuickBooks query/read stages.
   * paymentWrites does not use iteratorID / remainingCount.
   */
  iterators: Record<QuerySyncStage, IteratorState>;
}

const sessions = new Map<string, QBWCSession>();

export function createSession(
  token: string,
  initialStage: SyncStage = "customers"
): QBWCSession {
  const session: QBWCSession = {
    token,
    stage: initialStage,
    syncStartedAt: new Date(),
    iterators: {
      customers: { iteratorID: null, remainingCount: 0 },
      invoices: { iteratorID: null, remainingCount: 0 },
      receivePayments: { iteratorID: null, remainingCount: 0 },
      checks: { iteratorID: null, remainingCount: 0 },
    },
  };

  sessions.set(token, session);
  return session;
}

export function getSession(token: string): QBWCSession | null {
  return sessions.get(token) ?? null;
}

export function setStage(token: string, stage: SyncStage): void {
  const session = sessions.get(token);
  if (!session) return;

  session.stage = stage;
}

export function setIteratorState(
  token: string,
  stage: QuerySyncStage,
  iteratorID: string | null,
  remainingCount: number
): void {
  const session = sessions.get(token);
  if (!session) return;

  session.iterators[stage] = {
    iteratorID,
    remainingCount,
  };
}

export function resetIteratorState(
  token: string,
  stage: QuerySyncStage
): void {
  const session = sessions.get(token);
  if (!session) return;

  session.iterators[stage] = {
    iteratorID: null,
    remainingCount: 0,
  };
}

export function advanceStage(token: string): void {
  const session = sessions.get(token);
  if (!session) return;

  const order: SyncStage[] = [
    "customers",
    "invoices",
    "paymentWrites",
    "receivePayments",
    "checks",
    "done",
  ];

  const currentIndex = order.indexOf(session.stage);

  if (currentIndex === -1) {
    session.stage = "done";
    return;
  }

  session.stage = order[currentIndex + 1] ?? "done";
}

export function deleteSession(token: string): void {
  sessions.delete(token);
}