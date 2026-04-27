import { AlertTriangle } from "lucide-react";
import { formatMoney } from "../../../lib/formatters";

interface Props {
  overdueCount: number;
  totalOwed: number;
}

export function OverdueBanner({ overdueCount, totalOwed }: Props) {
  if (overdueCount === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span>
        <strong>{overdueCount} overdue invoice{overdueCount !== 1 ? "s" : ""}</strong> with{" "}
        <strong>{formatMoney(totalOwed)}</strong> outstanding — action required.
      </span>
    </div>
  );
}