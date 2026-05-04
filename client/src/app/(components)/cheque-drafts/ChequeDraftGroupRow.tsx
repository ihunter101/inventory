"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { ChequeDraftExpenseGroup } from "@/app/state/api";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "./chequeDraftUtils";
import ChequeDraftExpenseTable from "./ChequeDraftExpenseTable";

type Props = {
  group: ChequeDraftExpenseGroup;
  isExpanded: boolean;
  onToggle: (payeeName: string) => void;
  onTallyCheque: (group: ChequeDraftExpenseGroup) => void;
};

export default function ChequeDraftGroupRow({
  group,
  isExpanded,
  onToggle,
  onTallyCheque,
}: Props) {
  return (
    <div>
      <div className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <button
          type="button"
          onClick={() => onToggle(group.payeeName)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/40">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </span>

          <span className="min-w-0">
            <span className="block truncate font-semibold text-foreground">
              {group.payeeName}
            </span>

            <span className="block text-xs text-muted-foreground">
              {group.expenseCount} expense(s) ready to tally
            </span>
          </span>
        </button>

        <div className="flex items-center gap-3 md:justify-end">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="font-bold text-foreground">
              {formatCurrency(group.totalAmount)}
            </p>
          </div>

          <Button
            type="button"
            onClick={() => onTallyCheque(group)}
            className="rounded-full"
          >
            Tally Cheque
          </Button>
        </div>
      </div>

      {isExpanded && <ChequeDraftExpenseTable expenses={group.expenses} />}
    </div>
  );
}