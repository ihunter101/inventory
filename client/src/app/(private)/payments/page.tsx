"use client";

import { useMemo, useState } from "react";
import { useGetPaymentHistoryQuery } from "@/app/state/api";
import { currency } from "../../../lib/currency";
import {
  CalendarIcon,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Download,
  FileText,
  Hash,
  Loader2,
  Receipt,
  Search,
  TrendingUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

const METHOD_STYLE: Record<string, string> = {
  cash:     "bg-emerald-50 text-emerald-700 border-emerald-200",
  card:     "bg-blue-50   text-blue-700   border-blue-200",
  transfer: "bg-violet-50 text-violet-700 border-violet-200",
  cheque:   "bg-amber-50  text-amber-700  border-amber-200",
};

const STATUS_STYLE: Record<string, string> = {
  POSTED:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  VOID:    "bg-red-50     text-red-600    border-red-200",
  PENDING: "bg-amber-50   text-amber-700  border-amber-200",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function exportCSV(rows: any[]) {
  const headers = ["ID", "Date", "Method", "Supplier", "Invoice #", "PO #", "Reference", "Amount", "Status"];
  const lines = rows.map((p) =>
    [
      p.id,
      fmt(p.paidAt),
      p.method ?? "",
      p.supplierName ?? p.supplier ?? "",
      p.invoiceNumber ?? "",
      p.poNumber ?? "",
      p.reference ?? "",
      Number(p.amount ?? 0).toFixed(2),
      p.status ?? "POSTED",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportPDF(rows: any[]) {
  // Install: npm install jspdf jspdf-autotable
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text("Payments History", 14, 15);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    `Exported ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}  ·  ${rows.length} records`,
    14, 21
  );

  autoTable(doc, {
    startY: 27,
    head: [["Date", "Method", "Supplier", "Invoice #", "PO #", "Reference", "Amount", "Status"]],
    body: rows.map((p) => [
      fmt(p.paidAt),
      p.method ?? "—",
      p.supplierName ?? p.supplier ?? "—",
      p.invoiceNumber ?? "—",
      p.poNumber ?? "—",
      p.reference ?? "—",
      currency(Number(p.amount ?? 0)),
      p.status ?? "POSTED",
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [24, 24, 27], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: { 6: { halign: "right" } },
  });

  doc.save(`payments-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ── Sub-components ────────────────────────────────────────────────────────────
function KpiCard({
  label, value, icon, sub,
}: {
  label: string; value: string; icon: React.ReactNode; sub?: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-zinc-100 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-50 text-zinc-400">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">{label}</p>
        <p className="mt-0.5 text-2xl font-semibold tracking-tight text-zinc-900">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-zinc-400">{sub}</p>}
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{label}</span>
      <span className="text-sm text-zinc-700">{value}</span>
    </div>
  );
}

function PaymentRow({ p }: { p: any }) {
  const [open, setOpen] = useState(false);
  const methodKey = (p.method ?? "").toLowerCase();

  return (
    <>
      <tr
        className={cn(
          "group cursor-pointer border-b border-zinc-100 transition-colors hover:bg-zinc-50/80",
          open && "bg-zinc-50"
        )}
        onClick={() => setOpen((v) => !v)}
      >
        {/* Chevron */}
        <td className="w-8 pl-4 py-3.5 text-zinc-300">
          {open
            ? <ChevronDown size={15} className="text-zinc-500" />
            : <ChevronRight size={15} className="group-hover:text-zinc-500 transition-colors" />}
        </td>

        {/* Method */}
        <td className="py-3.5 pr-4">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
              METHOD_STYLE[methodKey] ?? "bg-zinc-50 text-zinc-400 border-zinc-200"
            )}>
              <CreditCard size={13} />
            </div>
            <span className="text-sm font-medium capitalize text-zinc-800">{p.method ?? "—"}</span>
          </div>
        </td>

        {/* Date */}
        <td className="py-3.5 pr-6 text-sm text-zinc-500 whitespace-nowrap">{fmt(p.paidAt)}</td>

        {/* Supplier */}
        <td className="py-3.5 pr-6 max-w-[180px]">
          <span className="block truncate text-sm text-zinc-700">
            {p.supplierName ?? p.supplier ?? "—"}
          </span>
        </td>

        {/* Invoice */}
        <td className="py-3.5 pr-6 text-sm text-zinc-500 font-mono">
          {p.invoiceNumber ? `#${p.invoiceNumber}` : "—"}
        </td>
        
        {/* Status */}
        <td className="py-3.5 pr-6">
          <Badge
            variant="outline"
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium",
              STATUS_STYLE[p.status ?? "POSTED"] ?? STATUS_STYLE.POSTED
            )}
          >
            {p.status ?? "POSTED"}
          </Badge>
        </td>

        {/* Amount */}
        <td className="py-3.5 pr-5 text-right text-sm font-bold text-emerald-600 whitespace-nowrap">
          {currency(Number(p.amount ?? 0))}
        </td>
      </tr>

      {/* Expanded detail panel */}
      {open && (
        <tr className="border-b border-zinc-100 bg-zinc-50/60">
          <td colSpan={8} className="px-6 pb-5 pt-3">
            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                Full Payment Details
              </p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
                <DetailField label="Payment ID"  value={p.id} />
                <DetailField label="Invoice #"   value={p.invoiceNumber} />
                <DetailField label="PO Number"   value={p.poNumber} />
                <DetailField label="Supplier"    value={p.supplierName ?? p.supplier} />
                <DetailField label="Method"      value={p.method} />
                <DetailField label="Reference"   value={p.reference} />
                <DetailField label="Date Paid"   value={fmt(p.paidAt)} />
                <DetailField label="Status"      value={p.status ?? "POSTED"} />
              </div>
              {p.notes && (
                <div className="mt-4 rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
                  {p.notes}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PaymentPage() {
  const [query,  setQuery]  = useState("");
  const [method, setMethod] = useState<string>("all");
  const [from,   setFrom]   = useState<string>("");
  const [to,     setTo]     = useState<string>("");
  const [page,   setPage]   = useState(1);

  const params = {
    q:      query.trim() || undefined,
    method: method === "all" ? undefined : method,
    from:   from || undefined,
    to:     to   || undefined,
  };

  const { data: payments = [], isLoading, isError } = useGetPaymentHistoryQuery(params);

  const kpis = useMemo(() => {
    const total   = payments.reduce((s, p) => s + Number(p.amount ?? 0), 0);
    const count   = payments.length;
    const average = count > 0 ? total / count : 0;
    return { total, count, average };
  }, [payments]);

  // Client-side pagination
  const totalPages = Math.max(1, Math.ceil(payments.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = payments.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleFilterChange = (fn: () => void) => { fn(); setPage(1); };

  // Pagination page numbers with ellipsis
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
    .reduce<(number | "…")[]>((acc, n, i, arr) => {
      if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push("…");
      acc.push(n);
      return acc;
    }, []);

  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-7">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Payments History
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Review, search, and export all recorded invoice payments
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-sm"
                disabled={isLoading || payments.length === 0}
              >
                <Download size={14} />
                Export
                <ChevronDown size={13} className="text-zinc-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem className="gap-2 text-sm" onClick={() => exportCSV(payments)}>
                <FileText size={13} />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-sm" onClick={() => exportPDF(payments)}>
                <FileText size={13} />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Filters ── */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                className="h-10 pl-9 text-sm focus-visible:ring-emerald-500"
                placeholder="Invoice # or supplier…"
                value={query}
                onChange={(e) => handleFilterChange(() => setQuery(e.target.value))}
              />
            </div>

            <Select value={method} onValueChange={(v) => handleFilterChange(() => setMethod(v))}>
              <SelectTrigger className="h-10 text-sm focus:ring-emerald-500">
                <SelectValue placeholder="Payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <CalendarIcon size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                type="date"
                className="h-10 pl-9 text-sm focus-visible:ring-emerald-500"
                value={from}
                onChange={(e) => handleFilterChange(() => setFrom(e.target.value))}
              />
            </div>

            <div className="relative">
              <CalendarIcon size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                type="date"
                className="h-10 pl-9 text-sm focus-visible:ring-emerald-500"
                value={to}
                onChange={(e) => handleFilterChange(() => setTo(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            label="Total Paid"
            value={currency(kpis.total)}
            icon={<TrendingUp size={18} />}
            sub={`Across ${kpis.count} payment${kpis.count !== 1 ? "s" : ""}`}
          />
          <KpiCard
            label="Payments"
            value={String(kpis.count)}
            icon={<Receipt size={18} />}
            sub="Matching current filters"
          />
          <KpiCard
            label="Average Payment"
            value={currency(kpis.average)}
            icon={<CreditCard size={18} />}
          />
        </div>

        {/* ── Table ── */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Payment Ledger
            </p>
            {!isLoading && !isError && (
              <Badge variant="outline" className="rounded-full text-xs text-zinc-500">
                {payments.length} record{payments.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          <Separator />

          {isLoading && (
            <div className="flex items-center gap-2 p-8 text-sm text-zinc-400">
              <Loader2 size={16} className="animate-spin" />
              Loading payments…
            </div>
          )}

          {isError && (
            <div className="p-8 text-sm text-red-500">
              Failed to load payments. Please try again.
            </div>
          )}

          {!isLoading && !isError && payments.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-16 text-zinc-400">
              <Receipt size={32} className="opacity-30" />
              <p className="text-sm">No payments match your filters</p>
            </div>
          )}

          {!isLoading && !isError && payments.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    <th className="w-8 pl-4 py-3" />
                    <th className="py-3 pr-4">Method</th>
                    <th className="py-3 pr-6">Date</th>
                    <th className="py-3 pr-6">Supplier</th>
                    <th className="py-3 pr-6">Invoice</th>
                    <th className="py-3 pr-6">PO</th>
                    <th className="py-3 pr-6">Status</th>
                    <th className="py-3 pr-5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((p) => (
                    <PaymentRow key={p.id} p={p} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination ── */}
          {!isLoading && !isError && totalPages > 1 && (
            <>
              <Separator />
              <div className="flex items-center justify-between px-5 py-3">
                <p className="text-xs text-zinc-400">
                  Showing {(safePage - 1) * PAGE_SIZE + 1}–
                  {Math.min(safePage * PAGE_SIZE, payments.length)} of {payments.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>

                  {pageNumbers.map((item, i) =>
                    item === "…" ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-xs text-zinc-400">…</span>
                    ) : (
                      <Button
                        key={item}
                        variant={safePage === item ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0 text-xs",
                          safePage === item && "bg-zinc-900 text-white hover:bg-zinc-800"
                        )}
                        onClick={() => setPage(item as number)}
                      >
                        {item}
                      </Button>
                    )
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}