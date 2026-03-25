"use client";

import { useMemo, useState } from "react";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Copy,
  Download,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Expense } from "@/app/state/api";
import { getCategoryColor } from "@/utils/categoryColors";

type Props = { expenses: Expense[] };
type SortKey = "date" | "amount" | "title";
type StatusFilter = "all" | "paid" | "pending" | "rejected";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  paid:     { label: "Paid",     icon: <CheckCircle2 className="h-3 w-3" />, cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  pending:  { label: "Pending",  icon: <Clock        className="h-3 w-3" />, cls: "bg-amber-50  text-amber-700  ring-1 ring-amber-200"  },
  rejected: { label: "Rejected", icon: <XCircle      className="h-3 w-3" />, cls: "bg-rose-50   text-rose-700   ring-1 ring-rose-200"   },
};

const StatusBadge = ({ status }: { status?: string }) => {
  const key = (status || "").toLowerCase();
  const cfg = STATUS_CONFIG[key];
  if (!cfg) return <span className="text-slate-400 text-xs">—</span>;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${cfg.cls}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
};

const SortIcon = ({ active, dir }: { active: boolean; dir: "asc" | "desc" }) => {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
};

const PAGE_SIZE = 8;
const STATUS_CYCLE: StatusFilter[] = ["all", "paid", "pending", "rejected"];

export const RecentTransactionsTable = ({ expenses }: Props) => {
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey,      setSortKey]      = useState<SortKey>("date");
  const [sortDir,      setSortDir]      = useState<"asc" | "desc">("desc");
  const [page,         setPage]         = useState(1);
  const [copied,       setCopied]       = useState<string | null>(null);

  const processed = useMemo(() => {
    let data = [...expenses];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(e =>
        e.title?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all")
      data = data.filter(e => e.status?.toLowerCase() === statusFilter);

    data.sort((a, b) => {
      if (sortKey === "amount") return sortDir === "asc" ? a.amount - b.amount : b.amount - a.amount;
      if (sortKey === "date") {
        const da = new Date(a.date).getTime(), db = new Date(b.date).getTime();
        return sortDir === "asc" ? da - db : db - da;
      }
      const ta = (a.title || "").toLowerCase(), tb = (b.title || "").toLowerCase();
      return sortDir === "asc" ? ta.localeCompare(tb) : tb.localeCompare(ta);
    });
    return data;
  }, [expenses, search, statusFilter, sortKey, sortDir]);

  const totalPages  = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const curPage     = Math.min(page, totalPages);
  const startIdx    = (curPage - 1) * PAGE_SIZE;
  const pageData    = processed.slice(startIdx, startIdx + PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const cycleStatus = () => {
    const idx = STATUS_CYCLE.indexOf(statusFilter);
    setStatusFilter(STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]);
    setPage(1);
  };

  const copyId = (id: string) => {
    navigator.clipboard?.writeText(id);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const thBtn = (key: SortKey, label: string) => (
    <button
      onClick={() => handleSort(key)}
      className="inline-flex items-center gap-1.5 font-medium hover:text-slate-900 transition-colors"
    >
      {label}
      <SortIcon active={sortKey === key} dir={sortDir} />
    </button>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-[system-ui,sans-serif]">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900 leading-tight">Transactions</h3>
          <p className="text-xs text-slate-400 mt-0.5">{processed.length} expenses</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* search */}
          <label className="flex items-center gap-2 h-8 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 focus-within:border-slate-400 focus-within:bg-white transition-colors w-52">
            <Search className="h-3.5 w-3.5 shrink-0" />
            <input
              className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none w-full"
              placeholder="Search…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </label>

          {/* status filter */}
          <button
            onClick={cycleStatus}
            className={`inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border transition-colors ${
              statusFilter === "all"
                ? "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                : "border-indigo-200 bg-indigo-50 text-indigo-700"
            }`}
          >
            <SlidersHorizontal className="h-3 w-3" />
            {statusFilter === "all" ? "All statuses" : `${statusFilter.charAt(0).toUpperCase()}${statusFilter.slice(1)} only`}
          </button>

          {/* export */}
          <button className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors">
            <Download className="h-3 w-3" />
            Export
          </button>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-xs text-slate-500">
              <th className="px-5 py-3 text-left">{thBtn("title",  "Title")}</th>
              <th className="px-5 py-3 text-left">{thBtn("amount", "Amount")}</th>
              <th className="px-5 py-3 text-left">{thBtn("date",   "Date")}</th>
              <th className="px-5 py-3 text-left">Category</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-left">ID</th>
              <th className="px-5 py-3 text-right">Receipt</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {pageData.map(expense => {
              const color = getCategoryColor(expense.category);
              return (
                <tr key={expense.expenseId} className="hover:bg-slate-50/70 transition-colors group">

                  {/* Title */}
                  <td className="px-5 py-3 font-medium text-slate-800 max-w-[180px] truncate">
                    {expense.title || <span className="text-slate-400 font-normal italic">Untitled</span>}
                  </td>

                  {/* Amount */}
                  <td className="px-5 py-3 text-slate-900 font-semibold tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <DollarSign className="h-2.5 w-2.5" />
                      </span>
                      {fmt(expense.amount)}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-5 py-3 text-slate-500 tabular-nums">{fmtDate(expense.date)}</td>

                  {/* Category */}
                  <td className="px-5 py-3">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full"
                      style={{ background: `${color}18`, color }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                      {expense.category || "Uncategorized"}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3"><StatusBadge status={expense.status} /></td>

                  {/* ID */}
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => copyId(expense.expenseId?.toString() || "")}
                      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 font-mono transition-colors"
                    >
                      <Copy className="h-3 w-3" />
                      <span className={copied === expense.expenseId?.toString() ? "text-emerald-600" : ""}>
                        {copied === expense.expenseId?.toString() ? "Copied!" : `#${expense.expenseId}`}
                      </span>
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3 text-right">
                    <button className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all">
                      <Download className="h-3 w-3" />
                      PDF
                    </button>
                  </td>
                </tr>
              );
            })}

            {pageData.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No expenses match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ─────────────────────────────────────── */}
      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>
          {processed.length === 0 ? "0" : `${startIdx + 1}–${startIdx + pageData.length}`}
          {" "}of{" "}
          <span className="font-medium text-slate-700">{processed.length}</span>
        </span>

        <div className="flex items-center gap-1">
          <button
            disabled={curPage === 1}
            onClick={() => setPage(p => p - 1)}
            className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {/* page pills */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - curPage) <= 1)
            .reduce<(number | "…")[]>((acc, p, i, arr) => {
              if (i > 0 && typeof arr[i - 1] === "number" && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} className="px-1 text-slate-400">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`h-7 w-7 inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors ${
                    curPage === p
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              )
            )}

          <button
            disabled={curPage === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecentTransactionsTable;