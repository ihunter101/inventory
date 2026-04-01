"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Filter,
  MoreHorizontal,
  Search,
  ArrowUpDown,
  DollarSign,
  Copy,
  Download,
  CheckCircle2,
  Clock3,
  BadgeCheck,
  Ban,
} from "lucide-react";
import { Expense, useUpdateExpenseStatusMutation } from "@/app/state/api";
import { getCategoryColor } from "@/utils/categoryColors";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  expenses: Expense[];
};

type SortKey = "date" | "amount" | "title";
type StatusFilter = "all" | "pending" | "approved" | "paid" | "void";

const formatCurrency = (amount: number) =>
  `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const getStatusColorClasses = (status: string = "") => {
  switch (status.toLowerCase()) {
    case "paid":
      return "border-emerald-200/50 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/40 dark:text-emerald-400";
    case "pending":
      return "border-amber-200/50 bg-amber-500/10 text-amber-700 dark:border-amber-900/40 dark:text-amber-400";
    case "approved":
      return "border-blue-200/50 bg-blue-500/10 text-blue-700 dark:border-blue-900/40 dark:text-blue-400";
    case "void":
      return "border-rose-200/50 bg-rose-500/10 text-rose-700 dark:border-rose-900/40 dark:text-rose-400";
    default:
      return "border-border/60 bg-muted/40 text-foreground";
  }
};

const getNextStatusFilter = (current: StatusFilter): StatusFilter => {
  switch (current) {
    case "all":
      return "pending";
    case "pending":
      return "approved";
    case "approved":
      return "paid";
    case "paid":
      return "void";
    case "void":
      return "all";
    default:
      return "all";
  }
};

const getStatusFilterLabel = (statusFilter: StatusFilter) => {
  switch (statusFilter) {
    case "all":
      return "All statuses";
    case "pending":
      return "Pending only";
    case "approved":
      return "Approved only";
    case "paid":
      return "Paid only";
    case "void":
      return "Void only";
    default:
      return "All statuses";
  }
};

const RecentTransactionsTable = ({ expenses }: Props) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [updateExpenseStatus, { isLoading: isUpdatingStatus }] =
    useUpdateExpenseStatusMutation();

  const handleStatusChange = async (
    expenseId: string,
    status: Expense["status"]
  ) => {
    const toastId = toast.loading("Updating expense status..." , {id: status})
    try {
      await updateExpenseStatus({ expenseId, status }).unwrap();
      toast.success('Successfully Updated Expense', {id: toastId})
    } catch (error) {
      console.error("Failed to update expense status:", error);
      toast.error("Failed to update Expense to:", {id: toastId})
    }
  };

  const processed = useMemo(() => {
    let data = [...expenses];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (e) =>
          e.category?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.expenseId?.toLowerCase().includes(q) ||
          e.status?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      data = data.filter(
        (e) => e.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    data.sort((a, b) => {
      if (sortKey === "amount") {
        return sortDir === "asc"
          ? Number(a.amount || 0) - Number(b.amount || 0)
          : Number(b.amount || 0) - Number(a.amount || 0);
      }

      if (sortKey === "date") {
        const da = new Date(a.createdAt).getTime();
        const db = new Date(b.createdAt).getTime();
        return sortDir === "asc" ? da - db : db - da;
      }

      const ta = (a.description || a.category || "").toLowerCase();
      const tb = (b.description || b.category || "").toLowerCase();

      if (ta < tb) return sortDir === "asc" ? -1 : 1;
      if (ta > tb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [expenses, search, statusFilter, sortKey, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortKey, sortDir, expenses]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageData = processed.slice(startIdx, startIdx + pageSize);

  const handleSortClick = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border/60 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Manage Expenses
        </h3>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex w-full items-center rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 sm:w-64">
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            <input
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              placeholder="Search title, category, ID, or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter((prev) => getNextStatusFilter(prev))}
              className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/60"
            >
              <Filter className="mr-1 h-3 w-3" />
              {getStatusFilterLabel(statusFilter)}
            </button>

            <button className="inline-flex items-center rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/40">
              <Download className="mr-1 h-3 w-3" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border/60">
          <thead className="bg-muted/30">
            <tr className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th className="px-6 py-3 text-left">
                <button
                  className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                  onClick={() => handleSortClick("title")}
                >
                  Title
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                  onClick={() => handleSortClick("amount")}
                >
                  Amount
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                  onClick={() => handleSortClick("date")}
                >
                  Date
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">Category</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">ID</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60 bg-card">
            {pageData.map((expense) => {
              const categoryColor = getCategoryColor(expense.category);
              const categoryBg = `${categoryColor}22`;

              return (
                <tr
                  key={expense.expenseId}
                  className="text-sm transition-colors hover:bg-muted/30"
                >
                  <td className="whitespace-nowrap px-6 py-3 text-foreground">
                    {expense.description || expense.category || "Untitled expense"}
                  </td>

                  <td className="whitespace-nowrap px-6 py-3 text-foreground">
                    <div className="inline-flex items-center gap-1">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border/60 bg-muted/40 text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                      </span>
                      <span className="font-medium">
                        {formatCurrency(Number(expense.amount || 0))}
                      </span>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-6 py-3 text-muted-foreground">
                    {new Date(expense.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })}
                  </td>

                  <td className="whitespace-nowrap px-6 py-3">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: categoryBg,
                        color: categoryColor,
                      }}
                    >
                      {expense.category || "Uncategorized"}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColorClasses(
                        expense.status
                      )}`}
                    >
                      {expense.status || "—"}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-3 text-muted-foreground">
                    <button
                      className="inline-flex items-center gap-1 text-xs transition-colors hover:text-foreground"
                      type="button"
                      onClick={() =>
                        navigator.clipboard?.writeText(expense.expenseId || "")
                      }
                    >
                      <Copy className="h-3 w-3" />
                      <span>{expense.expenseId}</span>
                    </button>
                  </td>

                  <td className="whitespace-nowrap px-6 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={isUpdatingStatus}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem
                          onClick={() =>
                            handleStatusChange(expense.expenseId, "PENDING")
                          }
                        >
                          <Clock3 className="mr-2 h-4 w-4" />
                          Mark as Pending
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() =>
                            handleStatusChange(expense.expenseId, "APPROVED")
                          }
                        >
                          <BadgeCheck className="mr-2 h-4 w-4" />
                          Mark as Approved
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() =>
                            handleStatusChange(expense.expenseId, "PAID")
                          }
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Mark as Paid
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() =>
                            handleStatusChange(expense.expenseId, "VOID")
                          }
                          className="text-rose-600 focus:text-rose-600"
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Mark as Void
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}

            {pageData.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-8 text-center text-sm text-muted-foreground"
                >
                  No expenses match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border/60 px-6 py-3 text-xs text-muted-foreground">
        <span>
          Showing{" "}
          <span className="font-medium text-foreground">
            {processed.length === 0 ? 0 : startIdx + 1}-{startIdx + pageData.length}
          </span>{" "}
          of{" "}
          <span className="font-medium text-foreground">{processed.length}</span>{" "}
          expenses
        </span>

        <div className="inline-flex items-center gap-2">
          <button
            className="rounded border border-border/60 bg-background px-2 py-1 text-foreground transition-colors disabled:opacity-40"
            disabled={currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>

          <span>
            Page <span className="font-medium text-foreground">{currentPage}</span>{" "}
            of <span className="font-medium text-foreground">{totalPages}</span>
          </span>

          <button
            className="rounded border border-border/60 bg-background px-2 py-1 text-foreground transition-colors disabled:opacity-40"
            disabled={currentPage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecentTransactionsTable;