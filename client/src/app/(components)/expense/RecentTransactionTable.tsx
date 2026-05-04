"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  Eye,
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

type SortKey = "date" | "amount" | "description" | "company";
type StatusFilter = "all" | "pending" | "approved" | "paid" | "void";

const formatCurrency = (amount: number, currency = "XCD") =>
  `${currency} ${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date?: string | null) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

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
    const toastId = toast.loading("Updating expense status...");

    try {
      await updateExpenseStatus({ expenseId, status }).unwrap();

      toast.success("Successfully updated expense.", {
        id: toastId,
      });
    } catch (error) {
      console.error("Failed to update expense status:", error);

      toast.error("Failed to update expense status.", {
        id: toastId,
      });
    }
  };

  const processed = useMemo(() => {
    let data = [...expenses];

    if (search.trim()) {
      const q = search.toLowerCase();

      data = data.filter(
        (e) =>
          e.companyName?.toLowerCase().includes(q) ||
          e.vendorName?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q) ||
          e.invoiceNumber?.toLowerCase().includes(q) ||
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
        const da = new Date(a.expenseDate || a.createdAt).getTime();
        const db = new Date(b.expenseDate || b.createdAt).getTime();

        return sortDir === "asc" ? da - db : db - da;
      }

      if (sortKey === "company") {
        const ca = (a.companyName || a.vendorName || "").toLowerCase();
        const cb = (b.companyName || b.vendorName || "").toLowerCase();

        if (ca < cb) return sortDir === "asc" ? -1 : 1;
        if (ca > cb) return sortDir === "asc" ? 1 : -1;
        return 0;
      }

      const da = (a.description || a.category || "").toLowerCase();
      const db = (b.description || b.category || "").toLowerCase();

      if (da < db) return sortDir === "asc" ? -1 : 1;
      if (da > db) return sortDir === "asc" ? 1 : -1;
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
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Expense Ledger
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            Review vendor expenses, invoices, statuses, and linked documents.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex w-full items-center rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 sm:w-80">
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />

            <input
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              placeholder="Search company, description, invoice, category, or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setStatusFilter((prev) => getNextStatusFilter(prev))
              }
              className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/60"
            >
              <Filter className="mr-1 h-3 w-3" />
              {getStatusFilterLabel(statusFilter)}
            </button>

            <button
              type="button"
              className="inline-flex items-center rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/40"
            >
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
                  onClick={() => handleSortClick("company")}
                >
                  Company
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>

              <th className="px-6 py-3 text-left">
                <button
                  className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                  onClick={() => handleSortClick("description")}
                >
                  Description
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
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60 bg-card">
            {pageData.map((expense) => {
              const categoryColor = getCategoryColor(expense.category);
              const categoryBg = `${categoryColor}22`;
              const company =
                expense.companyName || expense.vendorName || "Unknown company";

              return (
                <tr
                  key={expense.expenseId}
                  className="text-sm transition-colors hover:bg-muted/30"
                >
                  <td className="whitespace-nowrap px-6 py-3 text-foreground">
                    <div className="flex flex-col">
                      <span className="font-medium">{company}</span>

                      {expense.invoiceNumber && (
                        <span className="text-xs text-muted-foreground">
                          Invoice #{expense.invoiceNumber}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="min-w-[260px] px-6 py-3 text-foreground">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {expense.description || "No description"}
                      </span>

                      {expense.notes && (
                        <span className="line-clamp-1 text-xs text-muted-foreground">
                          {expense.notes}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-6 py-3 text-foreground">
                    <div className="inline-flex items-center gap-1">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border/60 bg-muted/40 text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                      </span>

                      <span className="font-medium">
                        {formatCurrency(
                          Number(expense.amount || 0),
                          expense.currency || "XCD"
                        )}
                      </span>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-6 py-3 text-muted-foreground">
                    {formatDate(expense.expenseDate || expense.createdAt)}
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
                        <DropdownMenuItem asChild>
                          <Link href={`/expenses/${expense.expenseId}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Expense
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() =>
                            navigator.clipboard?.writeText(
                              expense.expenseId || ""
                            )
                          }
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Expense ID
                        </DropdownMenuItem>

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
            {processed.length === 0 ? 0 : startIdx + 1}-
            {startIdx + pageData.length}
          </span>{" "}
          of{" "}
          <span className="font-medium text-foreground">
            {processed.length}
          </span>{" "}
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
            Page{" "}
            <span className="font-medium text-foreground">{currentPage}</span>{" "}
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