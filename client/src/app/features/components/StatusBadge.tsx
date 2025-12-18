"use client";

import type { LucideIcon } from "lucide-react";
import { CheckCircle, Clock, AlertCircle, Send, XCircle } from "lucide-react";

/**
 * Unified status union covering:
 * - POStatus: DRAFT | APPROVED | SENT | PARTIALLY_RECEIVED | RECEIVED | CLOSED
 * - InvoiceStatus: PENDING | PAID | OVERDUE
 * - GRNStatus: DRAFT | POSTED
 */
export type BadgeStatus =
  | "PENDING"
  | "APPROVED"
  | "RECEIVED"
  | "PARTIALLY_RECEIVED"
  | "PAID"
  | "OVERDUE"
  | "POSTED"
  | "DRAFT"
  | "SENT"
  | "CLOSED";

/** Styling + icon map for every supported status */
const MAP: Record<
  BadgeStatus,
  { cls: string; Icon: LucideIcon; label: string }
> = {
  PENDING: {
    cls: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/25",
    Icon: Clock,
    label: "Pending",
  },
  APPROVED: {
    cls: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/25",
    Icon: CheckCircle,
    label: "Approved",
  },
  RECEIVED: {
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25",
    Icon: CheckCircle,
    label: "Received",
  },
  PARTIALLY_RECEIVED: {
    cls: "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-500/25",
    Icon: CheckCircle,
    label: "Partially received",
  },
  PAID: {
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25",
    Icon: CheckCircle,
    label: "Paid",
  },
  OVERDUE: {
    cls: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/25",
    Icon: AlertCircle,
    label: "Overdue",
  },
  POSTED: {
    cls: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/25",
    Icon: CheckCircle,
    label: "Posted",
  },
  DRAFT: {
    cls: "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-500/25",
    Icon: Clock,
    label: "Draft",
  },
  SENT: {
    cls: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/25",
    Icon: Send,
    label: "Sent",
  },
  CLOSED: {
    cls: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-500/20 dark:text-slate-300 dark:ring-slate-500/30",
    Icon: XCircle,
    label: "Closed",
  },
};



type Props = {
  /** Accept strongly-typed union or any string; we normalize at runtime */
  status: BadgeStatus | string;
};

export default function StatusBadge({ status }: Props) {
const key = String(status || "DRAFT").toUpperCase() as BadgeStatus;
const { cls, Icon, label } = MAP[key] ?? MAP.DRAFT;

return (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${cls}`}
  >
    <Icon className="h-3.5 w-3.5" />
    {label}
  </span>
);

}
