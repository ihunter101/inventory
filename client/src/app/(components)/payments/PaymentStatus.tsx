
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    PAID: {
      label: "Paid",
      className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    },
    PARTIALLY_PAID: {
      label: "Partially Paid",
      className: "bg-amber-50 text-amber-700 border border-amber-200",
    },
    READY_TO_PAY: {
      label: "Ready to Pay",
      className: "bg-blue-50 text-blue-700 border border-blue-200",
    },
    PENDING: {
      label: "Pending",
      className: "bg-zinc-50 text-zinc-600 border border-zinc-200",
    },
    OVERDUE: {
      label: "Overdue",
      className: "bg-red-50 text-red-700 border border-red-200",
    },
  };
  const config = map[status] ?? {
    label: status,
    className: "bg-zinc-50 text-zinc-600 border border-zinc-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${config.className}`}
    >
      {config.label}
    </span>
  );
}