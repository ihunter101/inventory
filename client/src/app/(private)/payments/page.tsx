"use client";

import { useMemo, useState, useRef } from "react";
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
  cash: "border-emerald-200/50 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/40 dark:text-emerald-400",
  card: "border-blue-200/50 bg-blue-500/10 text-blue-700 dark:border-blue-900/40 dark:text-blue-400",
  transfer:
    "border-violet-200/50 bg-violet-500/10 text-violet-700 dark:border-violet-900/40 dark:text-violet-400",
  cheque:
    "border-amber-200/50 bg-amber-500/10 text-amber-700 dark:border-amber-900/40 dark:text-amber-400",
};

const STATUS_STYLE: Record<string, string> = {
  POSTED:
    "border-emerald-200/50 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/40 dark:text-emerald-400",
  VOID: "border-red-200/50 bg-red-500/10 text-red-600 dark:border-red-900/40 dark:text-red-400",
  PENDING:
    "border-amber-200/50 bg-amber-500/10 text-amber-700 dark:border-amber-900/40 dark:text-amber-400",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function exportCSV(rows: any[]) {
  const headers = [
    "ID",
    "Date",
    "Method",
    "Supplier",
    "Invoice #",
    "PO #",
    "Reference",
    "Amount",
    "Status",
  ];
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
    14,
    21
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
  label,
  value,
  icon,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">
          {value}
        </p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
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
          "group cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/20",
          open && "bg-muted/20"
        )}
        onClick={() => setOpen((v) => !v)}
      >
        {/* Chevron */}
        <td className="w-8 py-3.5 pl-4 text-muted-foreground">
          {open ? (
            <ChevronDown size={15} className="text-foreground/70" />
          ) : (
            <ChevronRight
              size={15}
              className="transition-colors group-hover:text-foreground/70"
            />
          )}
        </td>

        {/* Method */}
        <td className="py-3.5 pr-4">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                METHOD_STYLE[methodKey] ??
                  "border-border/60 bg-muted/30 text-muted-foreground"
              )}
            >
              <CreditCard size={13} />
            </div>
            <span className="text-sm font-medium capitalize text-foreground">
              {p.method ?? "—"}
            </span>
          </div>
        </td>

        {/* Date */}
        <td className="whitespace-nowrap py-3.5 pr-6 text-sm text-muted-foreground">
          {fmt(p.paidAt)}
        </td>

        {/* Supplier */}
        <td className="max-w-[180px] py-3.5 pr-6">
          <span className="block truncate text-sm text-foreground">
            {p.supplierName ?? "—"}
          </span>
        </td>

        {/* Invoice */}
        <td className="py-3.5 pr-6 font-mono text-sm text-muted-foreground">
          {p.invoiceNumber ? `#${p.invoiceNumber}` : "—"}
        </td>

        {/* PO */}
        <td className="py-3.5 pr-6 font-mono text-sm text-muted-foreground">
          {p.poNumber ? `#${p.poNumber}` : "—"}
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
        <td className="whitespace-nowrap py-3.5 pr-5 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">
          {currency(Number(p.amount ?? 0))}
        </td>
      </tr>

      {open && (
        <tr className="border-b border-border/60 bg-muted/10">
          <td colSpan={8} className="px-4 pb-5 pt-3 sm:px-6">
            <div className="rounded-lg border border-border/60 bg-card p-4 shadow-sm">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Full Payment Details
              </p>
              <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
                <DetailField label="Payment ID" value={p.id} />
                <DetailField label="Invoice #" value={p.invoiceNumber} />
                <DetailField label="PO Number" value={p.poNumber} />
                <DetailField label="Supplier" value={p.supplierName} />
                <DetailField label="Method" value={p.method} />
                <DetailField label="Reference" value={p.reference} />
                <DetailField label="Date Paid" value={fmt(p.paidAt)} />
                <DetailField label="Status" value={p.status ?? "POSTED"} />
              </div>

              {p.notes && (
                <div className="mt-4 rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
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
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const fromRef = useRef<HTMLInputElement | null>(null);
  const toRef = useRef<HTMLInputElement | null>(null);

  const params = {
    q: query.trim() || undefined,
    method: method === "all" ? undefined : method,
    from: from || undefined,
    to: to || undefined,
  };

  const { data: payments = [], isLoading, isError } = useGetPaymentHistoryQuery(params);

  const kpis = useMemo(() => {
    const total = payments.reduce((s, p) => s + Number(p.amount ?? 0), 0);
    const count = payments.length;
    const average = count > 0 ? total / count : 0;
    return { total, count, average };
  }, [payments]);

  // Client-side pagination
  const totalPages = Math.max(1, Math.ceil(payments.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = payments.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleFilterChange = (fn: () => void) => {
    fn();
    setPage(1);
  };

  // Pagination page numbers with ellipsis
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
    .reduce<(number | "…")[]>((acc, n, i, arr) => {
      if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push("…");
      acc.push(n);
      return acc;
    }, []);

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-7">
        {/* ── Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Payments History
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
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
                <ChevronDown size={13} className="text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 border-border/60 bg-popover">
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
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                className="h-10 pl-9 text-sm focus-visible:ring-primary"
                placeholder="Invoice # or supplier…"
                value={query}
                onChange={(e) => handleFilterChange(() => setQuery(e.target.value))}
              />
            </div>

            <Select value={method} onValueChange={(v) => handleFilterChange(() => setMethod(v))}>
              <SelectTrigger className="h-10 text-sm focus:ring-primary">
                <SelectValue placeholder="Payment method" />
              </SelectTrigger>
              <SelectContent className="border-border/60 bg-popover">
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>

            
              <div className="relative">
                <Input
                  type="date"
                  className="h-10 text-sm focus-visible:ring-primary"
                  value={from}
                  onChange={(e) => handleFilterChange(() => setFrom(e.target.value))}
                />
              </div>

            <div className="relative">
              <Input
                type="date"
                className="h-10 text-sm focus-visible:ring-primary"
                value={to}
                onChange={(e) => handleFilterChange(() => setFrom(e.target.value))}
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
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
          <div className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Payment Ledger
            </p>
            {!isLoading && !isError && (
              <Badge variant="outline" className="w-fit rounded-full text-xs text-muted-foreground">
                {payments.length} record{payments.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          <Separator />

          {isLoading && (
            <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin" />
              Loading payments…
            </div>
          )}

          {isError && (
            <div className="p-8 text-sm text-destructive">
              Failed to load payments. Please try again.
            </div>
          )}

          {!isLoading && !isError && payments.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <Receipt size={32} className="opacity-30" />
              <p className="text-sm">No payments match your filters</p>
            </div>
          )}

          {!isLoading && !isError && payments.length > 0 && (
            <>
              {/* Mobile cards */}
              <div className="space-y-3 p-4 md:hidden">
                {paginated.map((p) => {
                  const methodKey = (p.method ?? "").toLowerCase();
                  return (
                    <div
                      key={p.id}
                      className="rounded-xl border border-border/60 bg-background p-4"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold capitalize text-foreground">
                            {p.method ?? "Payment"}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {fmt(p.paidAt)}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-medium",
                            STATUS_STYLE[p.status ?? "POSTED"] ?? STATUS_STYLE.POSTED
                          )}
                        >
                          {p.status ?? "POSTED"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Supplier
                          </div>
                          <div className="truncate text-foreground">
                            {p.supplierName ?? p.supplierName ?? "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Invoice
                          </div>
                          <div className="font-mono text-foreground">
                            {p.invoiceNumber ? `#${p.invoiceNumber}` : "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            PO
                          </div>
                          <div className="text-foreground">{p.poNumber ?? "—"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Amount
                          </div>
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">
                            {currency(Number(p.amount ?? 0))}
                          </div>
                        </div>
                      </div>

                      {(p.reference || p.id) && (
                        <div className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                          {p.reference && (
                            <div className="flex items-center gap-1">
                              <Hash size={10} />
                              {p.reference}
                            </div>
                          )}
                          {!p.reference && <div>ID: {p.id}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="w-8 py-3 pl-4" />
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
            </>
          )}

          {/* ── Pagination ── */}
          {!isLoading && !isError && totalPages > 1 && (
            <>
              <Separator />
              <div className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Showing {(safePage - 1) * PAGE_SIZE + 1}–
                  {Math.min(safePage * PAGE_SIZE, payments.length)} of {payments.length}
                </p>
                <div className="flex flex-wrap items-center gap-1">
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
                      <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground">
                        …
                      </span>
                    ) : (
                      <Button
                        key={item}
                        variant={safePage === item ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0 text-xs",
                          safePage === item && "bg-foreground text-background hover:opacity-90"
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