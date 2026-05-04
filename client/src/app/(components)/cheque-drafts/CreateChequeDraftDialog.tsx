"use client";

import { Landmark, Loader2 } from "lucide-react";
import { ChequeDraftExpenseGroup } from "@/app/state/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "./chequeDraftUtils";

type Props = {
  open: boolean;
  selectedGroup: ChequeDraftExpenseGroup | null;
  isCreatingDraft: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateDraft: () => void;
};

export default function CreateChequeDraftDialog({
  open,
  selectedGroup,
  isCreatingDraft,
  onOpenChange,
  onCreateDraft,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create Draft Cheque</DialogTitle>
          <DialogDescription>
            Review the cheque details before creating the internal draft. This
            does not write anything to QuickBooks yet.
          </DialogDescription>
        </DialogHeader>

        {selectedGroup && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-border/60 bg-background p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Draft Cheque
                  </p>

                  <h3 className="mt-1 text-xl font-bold text-foreground">
                    Internal Payment Preparation
                  </h3>
                </div>

                <p className="text-sm text-muted-foreground">
                  {formatDate(new Date().toISOString())}
                </p>
              </div>

              <div className="mt-5 grid gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Pay to the order of
                  </p>

                  <div className="mt-1 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-lg font-semibold text-foreground">
                    {selectedGroup.payeeName}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Amount
                  </p>

                  <div className="mt-1 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-2xl font-bold text-foreground">
                    {formatCurrency(selectedGroup.totalAmount)}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Memo
                  </p>

                  <div className="mt-1 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm text-foreground">
                    Draft cheque for {selectedGroup.expenseCount} expense(s) -{" "}
                    {selectedGroup.payeeName}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200/60 bg-amber-500/10 p-4 text-sm text-amber-700 dark:border-amber-900/40 dark:text-amber-400">
              Creating this draft will link these expenses to a cheque draft and
              move them to <strong>APPROVED</strong>. They should only be marked{" "}
              <strong>PAID</strong> after the real cheque is entered or matched
              from QuickBooks.
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreatingDraft}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={onCreateDraft}
            disabled={isCreatingDraft || !selectedGroup}
          >
            {isCreatingDraft ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Landmark className="mr-2 h-4 w-4" />
                Create Draft Cheque
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}