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
      return "bg-emerald-100 text-emerald-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "rejected":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
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

  // 1. filter + search + sort
  const processed = useMemo(() => {
    let data = [...expenses];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
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
        return sortDir === "asc"
          ? a.amount - b.amount
          : b.amount - a.amount;
      }

      if (sortKey === "date") {
        const da = new Date(a.date).getTime();
        const db = new Date(b.date).getTime();
        return sortDir === "asc" ? da - db : db - da;
      }

      // title
      const ta = (a.title || "").toLowerCase();
      const tb = (b.title || "").toLowerCase();
      if (ta < tb) return sortDir === "asc" ? -1 : 1;
      if (ta > tb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [expenses, search, statusFilter, sortKey, sortDir]);

  // 2. pagination
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
    <div className="bg-white rounded-2xl shadow border border-slate-200">
      {/* HEADER BAR: title + search + filter/sort + export */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          Manage Expenses
        </h3>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* search */}
          <div className="flex items-center w-full sm:w-64 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
            <Search className="h-4 w-4 text-slate-400 mr-2" />
            <input
              className="bg-transparent outline-none text-sm text-slate-700 w-full"
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
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-full hover:bg-slate-200"
            >
              <Filter className="h-3 w-3 mr-1" />
              {statusFilter === "all"
                ? "All statuses"
                : statusFilter === "paid"
                ? "Paid only"
                : "Pending only"}
            </button>

            {/* export button */}
            <button className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50">
              <Download className="h-3 w-3 mr-1" />
              Export
            </button>

            <button className="p-1 text-slate-400 hover:text-slate-600">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              <th className="px-6 py-3 text-left">
                <button
                  className="inline-flex items-center gap-1 hover:text-slate-700"
                  onClick={() => handleSortClick("title")}
                >
                  Title
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  className="inline-flex items-center gap-1 hover:text-slate-700"
                  onClick={() => handleSortClick("amount")}
                >
                  Amount
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  className="inline-flex items-center gap-1 hover:text-slate-700"
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

          <tbody className="bg-white divide-y divide-slate-100">
            {pageData.map((expense) => {
              const categoryColor = getCategoryColor(expense.category);
              const categoryBg = `${categoryColor}22`; // same color, low opacity

              return (
                <tr
                  key={expense.expenseId}
                  className="hover:bg-slate-50 text-sm"
                >
                  {/* Title */}
                  <td className="px-6 py-3 whitespace-nowrap text-slate-800">
                    {expense.title && "Untitled expense"}
                  </td>

                  {/* Amount with $ icon */}
                  <td className="px-6 py-3 whitespace-nowrap text-slate-900">
                    <div className="inline-flex items-center gap-1">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-slate-100 text-slate-500">
                        <DollarSign className="h-3 w-3" />
                      </span>
                      <span className="font-medium">
                        {formatCurrency(expense.amount)}
                      </span>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-3 whitespace-nowrap text-slate-600">
                    {new Date(expense.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })}
                  </td>

                  {/* Category pill */}
                  <td className="px-6 py-3 whitespace-nowrap">
                    <span
                      className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full"
                      style={{
                        backgroundColor: categoryBg,
                        color: categoryColor,
                      }}
                    >
                      {expense.category || "Uncategorized"}
                    </span>
                  </td>

                  {/* Status badge */}
                  <td className="px-6 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColorClasses(
                        expense.status
                      )}`}
                    >
                      {expense.status || "—"}
                    </span>
                  </td>

                  {/* ID with two-paper icon */}
                  <td className="px-6 py-3 whitespace-nowrap text-slate-600">
                    <button
                      className="inline-flex items-center gap-1 text-xs hover:text-slate-900"
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
                  <td className="px-6 py-3 whitespace-nowrap text-right">
                    <button className="text-xs font-medium text-blue-600 hover:underline">
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
                  className="px-6 py-8 text-center text-sm text-slate-500"
                >
                  No expenses match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER: pagination summary */}
      <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing{" "}
          <span className="font-medium">
            {processed.length === 0 ? 0 : startIdx + 1}-
            {startIdx + pageData.length}
          </span>{" "}
          of <span className="font-medium">{processed.length}</span> expenses
        </span>

        <div className="inline-flex items-center gap-2">
          <button
            className="px-2 py-1 rounded border border-slate-200 bg-white disabled:opacity-40"
            disabled={currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span>
            Page <span className="font-medium">{currentPage}</span> of{" "}
            <span className="font-medium">{totalPages}</span>
          </span>
          <button
            className="px-2 py-1 rounded border border-slate-200 bg-white disabled:opacity-40"
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
