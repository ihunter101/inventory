export type SyncStage =
  | "customers"
  | "invoices"
  | "receivePayments"
  | "checks"
  | "done";

export interface QBWCSession {
  token: string;
  stage: SyncStage;
  data: {
    customers: any[];
    invoices: any[];
    receivePayments: any[];
    checks: any[];
  };
}

const sessions = new Map<string, QBWCSession>();

export function createSession(token: string): QBWCSession {
  const session: QBWCSession = {
    token,
    stage: "customers",
    data: {
      customers: [],
      invoices: [],
      receivePayments: [],
      checks: [],
    },
  };

  sessions.set(token, session);
  return session;
}

export function getSession(token: string): QBWCSession | null {
  return sessions.get(token) ?? null;
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