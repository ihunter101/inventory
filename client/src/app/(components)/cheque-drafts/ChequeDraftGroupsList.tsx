"use client";

import { FileText, Loader2 } from "lucide-react";
import { ChequeDraftExpenseGroup } from "@/app/state/api";
import ChequeDraftGroupRow from "./ChequeDraftGroupRow";

type Props = {
  groups: ChequeDraftExpenseGroup[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  expandedPayees: Record<string, boolean>;
  onTogglePayee: (payeeName: string) => void;
  onTallyCheque: (group: ChequeDraftExpenseGroup) => void;
};

export default function ChequeDraftGroupsList({
  groups,
  isLoading,
  isFetching,
  isError,
  error,
  expandedPayees,
  onTogglePayee,
  onTallyCheque,
}: Props) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="border-b border-border/60 px-6 py-4">
        <h2 className="text-lg font-semibold text-foreground">
          Companies to Pay
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          These are unpaid and unvoided expenses for the current month that are
          not already attached to a cheque draft.
        </p>
      </div>

      {isLoading || isFetching ? (
        <div className="flex items-center gap-2 px-6 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading cheque groups...
        </div>
      ) : isError ? (
        <div className="px-6 py-8 text-sm text-rose-500">
          Failed to load cheque groups: {JSON.stringify(error)}
        </div>
      ) : groups.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/40">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>

          <h3 className="font-semibold text-foreground">
            No cheque drafts needed right now
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            There are no unpaid/unvoided expenses for this month waiting to be
            tallied.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {groups.map((group) => (
            <ChequeDraftGroupRow
              key={group.payeeName}
              group={group}
              isExpanded={Boolean(expandedPayees[group.payeeName])}
              onToggle={onTogglePayee}
              onTallyCheque={onTallyCheque}
            />
          ))}
        </div>
      )}
    </section>
  );
}