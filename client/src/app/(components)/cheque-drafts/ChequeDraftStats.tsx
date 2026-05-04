"use client";

import { Landmark, ReceiptText, WalletCards } from "lucide-react";
import { ChequeDraftExpenseGroup } from "@/app/state/api";
import { formatCurrency } from "./chequeDraftUtils";

type Props = {
  monthLabel: string;
  groups: ChequeDraftExpenseGroup[];
};

export default function ChequeDraftStats({ monthLabel, groups }: Props) {
  const totalPendingAmount = groups.reduce(
    (sum, group) => sum + Number(group.totalAmount || 0),
    0
  );

  const totalExpenseCount = groups.reduce(
    (sum, group) => sum + Number(group.expenseCount || 0),
    0
  );

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Month</p>
          <ReceiptText className="h-5 w-5 text-muted-foreground" />
        </div>

        <p className="mt-3 text-2xl font-bold text-foreground">{monthLabel}</p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Pending Payees</p>
          <WalletCards className="h-5 w-5 text-muted-foreground" />
        </div>

        <p className="mt-3 text-2xl font-bold text-foreground">
          {groups.length}
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Unpaid Total</p>
          <Landmark className="h-5 w-5 text-muted-foreground" />
        </div>

        <p className="mt-3 text-2xl font-bold text-foreground">
          {formatCurrency(totalPendingAmount)}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          Across {totalExpenseCount} expense(s)
        </p>
      </div>
    </section>
  );
}