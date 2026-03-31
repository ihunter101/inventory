"use client";

import { useMemo, useState } from "react";
import {
  Filter,
  MoreHorizontal,
  Search,
  ArrowUpDown,
  DollarSign,
  Copy,
  Download,
} from "lucide-react";
import { Expense } from "@/app/state/api";
import { getCategoryColor } from "@/utils/categoryColors";

type Props = {
  expenses: Expense[];
};

type SortKey = "date" | "amount" | "title";

const formatCurrency = (amount: number) =>
  `$${amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

const getStatusColorClasses = (status: string = "") => {
  switch (status.toLowerCase()) {
    case "paid":
      return "border-emerald-200/50 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/40 dark:text-emerald-400";
    case "pending":
      return "border-amber-200/50 bg-amber-500/10 text-amber-700 dark:border-amber-900/40 dark:text-amber-400";
    case "rejected":
      return "border-rose-200/50 bg-rose-500/10 text-rose-700 dark:border-rose-900/40 dark:text-rose-400";
    default:
      return "border-border/60 bg-muted/40 text-foreground";
  }
};

export const RecentTransactionsTable = ({ expenses }: Props) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">(
    "all"
  );
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const processed = useMemo(() => {
    let data = [...expenses];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (e) =>
          e.category?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      data = data.filter(
        (e) => e.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    data.sort((a, b) => {
      if (sortKey === "amount") {
        return sortDir === "asc" ? a.amount - b.amount : b.amount - a.amount;
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
      {/* HEADER BAR */}
      <div className="flex flex-col gap-3 border-b border-border/60 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Manage Expenses
        </h3>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* search */}
          <div className="flex w-full items-center rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 sm:w-64">
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            <input
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              placeholder="Search title or category..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* filter */}
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setStatusFilter((prev) =>
                  prev === "all" ? "pending" : prev === "pending" ? "paid" : "all"
                )
              }
              className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/60"
            >
              <Filter className="mr-1 h-3 w-3" />
              {statusFilter === "all"
                ? "All statuses"
                : statusFilter === "paid"
                ? "Paid only"
                : "Pending only"}
            </button>

            <button className="inline-flex items-center rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/40">
              <Download className="mr-1 h-3 w-3" />
              Export
            </button>

            <button className="p-1 text-muted-foreground transition-colors hover:text-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}
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
                  {/* Title */}
                  <td className="whitespace-nowrap px-6 py-3 text-foreground">
                    {expense.description || expense.category || "Untitled expense"}
                  </td>

                  {/* Amount */}
                  <td className="whitespace-nowrap px-6 py-3 text-foreground">
                    <div className="inline-flex items-center gap-1">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border/60 bg-muted/40 text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                      </span>
                      <span className="font-medium">
                        {formatCurrency(expense.amount)}
                      </span>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="whitespace-nowrap px-6 py-3 text-muted-foreground">
                    {new Date(expense.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })}
                  </td>

                  {/* Category */}
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

                  {/* Status */}
                  <td className="whitespace-nowrap px-6 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColorClasses(
                        expense.status
                      )}`}
                    >
                      {expense.status || "—"}
                    </span>
                  </td>

                  {/* ID */}
                  <td className="whitespace-nowrap px-6 py-3 text-muted-foreground">
                    <button
                      className="inline-flex items-center gap-1 text-xs transition-colors hover:text-foreground"
                      type="button"
                      onClick={() =>
                        navigator.clipboard?.writeText(
                          expense.expenseId?.toString() || ""
                        )
                      }
                    >
                      <Copy className="h-3 w-3" />
                      <span>{expense.expenseId}</span>
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="whitespace-nowrap px-6 py-3 text-right">
                    <button className="text-xs font-medium text-primary transition-colors hover:underline">
                      Download
                    </button>
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

      {/* FOOTER */}
      <div className="flex items-center justify-between border-t border-border/60 px-6 py-3 text-xs text-muted-foreground">
        <span>
          Showing{" "}
          <span className="font-medium text-foreground">
            {processed.length === 0 ? 0 : startIdx + 1}-{startIdx + pageData.length}
          </span>{" "}
          of <span className="font-medium text-foreground">{processed.length}</span>{" "}
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
            Page <span className="font-medium text-foreground">{currentPage}</span> of{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
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