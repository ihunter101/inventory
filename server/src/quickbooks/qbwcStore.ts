//server/src/quickbooks/qbwcStore
export type SyncStage =
  | "customers"
  | "invoices"
  | "receivePayments"
  | "checks"
  | "done";

type IteratorState = {
  iteratorID: string | null;
  remainingCount: number;
};

export interface QBWCSession {
  token: string;
  stage: SyncStage;
  iterators: Record<Exclude<SyncStage, "done">, IteratorState>;
}

const sessions = new Map<string, QBWCSession>();

export function createSession(token: string): QBWCSession {
  const session: QBWCSession = {
    token,
    stage: "customers",
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

export function setIteratorState(
  token: string,
  stage: Exclude<SyncStage, "done">,
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
  stage: Exclude<SyncStage, "done">
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
    "receivePayments",
    "checks",
    "done",
  ];

  const currentIndex = order.indexOf(session.stage);
  session.stage = order[currentIndex + 1] ?? "done";
}

export function deleteSession(token: string): void {
  sessions.delete(token);
}