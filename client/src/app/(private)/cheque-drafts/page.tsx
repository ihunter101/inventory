"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  ChequeDraftExpenseGroup,
  useCreateChequeDraftMutation,
  useGetChequeDraftExpenseGroupsQuery,
} from "@/app/state/api";

import ChequeDraftsHeader from "@/app/(components)/cheque-drafts/ChequeDraftsHeader";
import ChequeDraftStats from "@/app/(components)/cheque-drafts/ChequeDraftStats";
import ChequeDraftGroupsList from "@/app/(components)/cheque-drafts/ChequeDraftGroupsList";
import CreateChequeDraftDialog from "@/app/(components)/cheque-drafts/CreateChequeDraftDialog";

import {
  getCurrentMonthLabel,
  getCurrentMonthRange,
} from "@/app/(components)/cheque-drafts/chequeDraftUtils";

import { devError, devLog } from "@/app/(components)/cheque-drafts/devLog";

export default function ChequeDraftsPage() {
  const [expandedPayees, setExpandedPayees] = useState<Record<string, boolean>>(
    {}
  );

  const [selectedGroup, setSelectedGroup] =
    useState<ChequeDraftExpenseGroup | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const range = useMemo(() => getCurrentMonthRange(), []);
  const monthLabel = useMemo(() => getCurrentMonthLabel(), []);

  const {
    data: groups = [],
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetChequeDraftExpenseGroupsQuery(range);

  const [createChequeDraft, { isLoading: isCreatingDraft }] =
    useCreateChequeDraftMutation();

  const togglePayee = (payeeName: string) => {
    devLog("Toggle payee accordion", { payeeName });

    setExpandedPayees((prev) => ({
      ...prev,
      [payeeName]: !prev[payeeName],
    }));
  };

  const handleOpenChequeDialog = (group: ChequeDraftExpenseGroup) => {
    devLog("Open create cheque draft dialog", {
      payeeName: group.payeeName,
      expenseCount: group.expenseCount,
      totalAmount: group.totalAmount,
    });

    setSelectedGroup(group);
    setIsDialogOpen(true);
  };

  const handleCreateChequeDraft = async () => {
    if (!selectedGroup) return;

    const expenseIds = selectedGroup.expenses.map(
      (expense) => expense.expenseId
    );

    devLog("Create cheque draft request", {
      payeeName: selectedGroup.payeeName,
      expenseIds,
      totalAmount: selectedGroup.totalAmount,
    });

    const toastId = toast.loading("Creating cheque draft...");

    try {
      await createChequeDraft({
        payeeName: selectedGroup.payeeName,
        expenseIds,
        chequeDate: new Date().toISOString(),
        memo: `Draft cheque for ${selectedGroup.expenseCount} expense(s) - ${selectedGroup.payeeName}`,
      }).unwrap();

      toast.success("Cheque draft created successfully.", {
        id: toastId,
      });

      devLog("Cheque draft created successfully", {
        payeeName: selectedGroup.payeeName,
      });

      setIsDialogOpen(false);
      setSelectedGroup(null);
    } catch (error) {
      devError("Failed to create cheque draft", error);

      toast.error("Failed to create cheque draft.", {
        id: toastId,
      });
    }
  };

  return (
    <main className="space-y-6 p-6">
      <ChequeDraftsHeader />

      <ChequeDraftStats monthLabel={monthLabel} groups={groups} />

      <ChequeDraftGroupsList
        groups={groups}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        error={error}
        expandedPayees={expandedPayees}
        onTogglePayee={togglePayee}
        onTallyCheque={handleOpenChequeDialog}
      />

      <CreateChequeDraftDialog
        open={isDialogOpen}
        selectedGroup={selectedGroup}
        isCreatingDraft={isCreatingDraft}
        onOpenChange={setIsDialogOpen}
        onCreateDraft={handleCreateChequeDraft}
      />
    </main>
  );
}