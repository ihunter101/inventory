import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  PENDING:        "bg-amber-50  text-amber-700  border-amber-200",
  READY_TO_PAY:   "bg-blue-50   text-blue-700   border-blue-200",
  PARTIALLY_PAID: "bg-violet-50 text-violet-700 border-violet-200",
  PAID:           "bg-emerald-50 text-emerald-700 border-emerald-200",
  OVERDUE:        "bg-red-50    text-red-700    border-red-200",
  VOID:           "bg-zinc-100  text-zinc-500   border-zinc-200",
  CLOSED:         "bg-zinc-100  text-zinc-500   border-zinc-200",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:        "Pending",
  READY_TO_PAY:   "Ready to Pay",
  PARTIALLY_PAID: "Partial",
  PAID:           "Paid",
  OVERDUE:        "Overdue",
  VOID:           "Void",
  CLOSED:         "Closed",
};

interface Props {
  status: string;
  className?: string;
}

export function InvoiceStatusBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status] ?? "bg-zinc-100 text-zinc-600 border-zinc-200",
        className
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}