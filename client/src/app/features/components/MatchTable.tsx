"use client";

import {
  GoodsReceiptDTO,
  SupplierInvoiceDTO,
  PurchaseOrderDTO,
  useCreateMatchMutation,
  useUpdateInvoiceStatusMutation,
  useGetPoInvoicePaymentsQuery,
} from "@/app/state/api";

import { currency } from "../../../lib/currency";
import buildMatchRows from "@/lib/matching";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  FileText,
  CircleDollarSignIcon,
  Clock,
  Banknote,
} from "lucide-react";
import { toast } from "sonner";
import { PayInvoiceDialog } from "@/app/(components)/payments/PaymentDialog";
import StatusBadge from "./StatusBadge";
import PaymentSummaryPanel from "@/app/(components)/payments/PaymentSummary";

// ─────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────
type Props = {
  po?: PurchaseOrderDTO;
  relatedInvoices: SupplierInvoiceDTO[];
  relatedGRNs: GoodsReceiptDTO[];
  allPOs: PurchaseOrderDTO[];
  currentPOId?: string | null;
  onChangePO: (poId: string) => void;
};

export type PaymentRecord = {
  id: string;
  invoiceId: string;
  amount: number;
  paidAt: string;
  method?: string;
  reference?: string;
  status: string;
};

export default function MatchTable({
  po,
  relatedInvoices,
  relatedGRNs,
  allPOs,
  currentPOId,
  onChangePO,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-1 flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-foreground/80" />
          <div className="text-base font-bold tracking-tight text-foreground">
            Three-Way Match Dashboard
          </div>
        </div>

        <div className="mb-4 text-sm text-muted-foreground">
          Reviewing:{" "}
          <span className="font-semibold text-foreground">
            {po?.poNumber ?? "Select a Purchase Order"}
          </span>
        </div>

        <select
          className="w-full rounded-lg border border-border/60 bg-background px-3 py-2.5 text-sm text-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-ring"
          value={currentPOId ?? ""}
          onChange={(e) => onChangePO(e.target.value)}
        >
          <option value="" disabled>
            Select a Purchase Order…
          </option>
          {allPOs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.poNumber ?? p.id} — {p.supplier?.name ?? "Unknown supplier"}
            </option>
          ))}
        </select>

        {!currentPOId && (
          <p className="mt-3 text-sm text-muted-foreground">
            Please select a Purchase Order to view matches.
          </p>
        )}
        {currentPOId && relatedInvoices.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            No invoices found for this Purchase Order yet.
          </p>
        )}
      </div>

      {/* Invoice cards */}
      <div className="space-y-4">
        {relatedInvoices.map((invoice) => {
          const matchingGRN = relatedGRNs.find((g) => g.invoiceId === invoice.id);
          return (
            <MatchCard key={invoice.id} po={po} invoice={invoice} grn={matchingGRN} />
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  MatchCard
// ─────────────────────────────────────────────────────────────
function MatchCard({
  po,
  invoice,
  grn,
}: {
  po?: PurchaseOrderDTO;
  invoice: SupplierInvoiceDTO;
  grn?: GoodsReceiptDTO;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [checkedLines, setCheckedLines] = useState<Record<string, boolean>>({});

  const [createMatch, { isLoading: isMatching }] = useCreateMatchMutation();
  const [updateInvoiceStatus, { isLoading: isUpdating }] =
    useUpdateInvoiceStatusMutation();

  const { data: rawPayments = [] } = useGetPoInvoicePaymentsQuery(
    { id: po!.id },
    { skip: !po?.id }
  );

  const paymentsArray = Array.isArray(rawPayments)
    ? rawPayments
    : (rawPayments as any)?.payments ?? (rawPayments as any)?.data ?? [];

  const thisInvoicePayments: PaymentRecord[] = useMemo(
    () =>
      paymentsArray
        .filter((p: PaymentRecord) => p.invoiceId === invoice.id)
        .map((p: PaymentRecord) => ({
          id: p.id,
          invoiceId: p.invoiceId,
          amount: Number(p.amount ?? 0),
          paidAt: p.paidAt,
          method: p.method,
          reference: p.reference,
          status: p.status,
        })),
    [paymentsArray, invoice.id]
  );


  const rows = useMemo(() => {
    if (!po) return [];
    return buildMatchRows(po, invoice, grn);
  }, [po, invoice, grn]);

const isGrnPosted = grn?.status === "POSTED";
const allLinesMatch = rows.length > 0 && rows.every((r) => r.lineOk);

const payableSubtotal = useMemo(() => {
  return rows.reduce((acc: number, r: any) => {
    return acc + Number(r.payableAmount ?? 0);
  }, 0);
}, [rows]);

const invoiceSubtotal = useMemo(() => {
  return (invoice.lines ?? []).reduce((acc: number, line: any) => {
    return acc + Number(line.quantity ?? 0) * Number(line.unitPrice ?? 0);
  }, 0);
}, [invoice.lines]);

const invoiceTotal = Number(invoice.amount ?? 0);
const invoiceTax = Math.max(invoiceTotal - invoiceSubtotal, 0);

const payableTax = useMemo(() => {
  if (invoiceSubtotal <= 0 || payableSubtotal <= 0 || invoiceTax <= 0) return 0;
  return (payableSubtotal / invoiceSubtotal) * invoiceTax;
}, [invoiceSubtotal, payableSubtotal, invoiceTax]);

const finalPayableTotal = useMemo(() => {
  return payableSubtotal + payableTax;
}, [payableSubtotal, payableTax]);

const balanceRemaining =
  invoice.balanceRemaining != null
    ? Number(invoice.balanceRemaining)
    : invoiceTotal;

  const isPaid = invoice.status === "PAID";
  const isPartiallyPaid = invoice.status === "PARTIALLY_PAID";
  const isReadyToPay = invoice.status === "READY_TO_PAY";
  const isAlreadyApproved = isReadyToPay || isPartiallyPaid || isPaid;

  const canApprove =
    !!po && !!grn && isGrnPosted && allLinesMatch && !isAlreadyApproved;

  // Greedy: mark lines as "paid" for partial payment UI
  const totalPaid = thisInvoicePayments.reduce((s, p) => s + p.amount, 0);
  const rowsWithState = useMemo(() => {
    if (!isPartiallyPaid || thisInvoicePayments.length === 0) return rows;
    let remaining = totalPaid;
    return rows.map((row) => {
      const amt = row.payableAmount || 0;
      if (remaining >= amt) {
        remaining -= amt;
        return { ...row, _paid: true };
      }
      return { ...row, _paid: false };
    });
  }, [rows, isPartiallyPaid, totalPaid, thisInvoicePayments]);

  const selectedCount = useMemo(() => {
    return rowsWithState.reduce((count, row: any) => {
      const isSelected = !!checkedLines[row.key];
      const isAlreadyPaid = !!row._paid || isPaid;
      if (!isSelected || isAlreadyPaid) return count;
      return count + 1;
    }, 0);
  }, [rowsWithState, checkedLines, isPaid]);

const selectedPaySubtotal = useMemo(() => {
  return rowsWithState.reduce((sum: number, row: any) => {
    const isSelected = !!checkedLines[row.key];
    const isAlreadyPaid = !!row._paid || isPaid;
    if (!isSelected || isAlreadyPaid) return sum;

    return sum + Number(row.payableAmount ?? 0);
  }, 0);
}, [rowsWithState, checkedLines, isPaid]);

const selectedPayTax = useMemo(() => {
  if (payableSubtotal <= 0 || payableTax <= 0 || selectedPaySubtotal <= 0) return 0;
  return (selectedPaySubtotal / payableSubtotal) * payableTax;
}, [selectedPaySubtotal, payableSubtotal, payableTax]);

const selectedPayAmount = useMemo(() => {
  return selectedPaySubtotal + selectedPayTax;
}, [selectedPaySubtotal, selectedPayTax]);

  const handleApproveMatch = async () => {
    if (!po || !grn) return;
    try {
      await createMatch({ poId: po.id, invoiceId: invoice.id, grnId: grn.id }).unwrap();
      await updateInvoiceStatus({ id: invoice.id, status: "READY_TO_PAY" }).unwrap();
      toast.success("Match approved — invoice is ready to pay.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve match.");
    }
  };

  const invoiceDate = invoice.date
    ? new Date(invoice.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "No date";

  // Left border accent by status
  const accentBorder = isPaid
    ? "border-l-4 border-l-emerald-500"
    : isPartiallyPaid
    ? "border-l-4 border-l-amber-400"
    : isReadyToPay
    ? "border-l-4 border-l-blue-500"
    : "border-l-4 border-l-border";

  return (
    <div
      className={`block rounded-xl border border-border/60 bg-card shadow-sm ${accentBorder}`}
    >
      {/* ── Header row ── */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/20 sm:px-5"
      >
        <div className="flex min-w-0 items-center gap-3">
          {isExpanded ? (
            <ChevronDown size={16} className="shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
          )}

          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-foreground">
              Invoice #{invoice.invoiceNumber}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">{invoiceDate}</div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Amount
            </div>
            <div className="text-sm font-bold text-foreground">
              {currency(invoiceTotal)}
            </div>
          </div>
          <StatusBadge status={invoice.status} />
        </div>
      </button>

      {/* ── Meta strip ── */}
      <div className="grid grid-cols-1 gap-px border-y border-border/60 bg-border/40 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: <FileText size={13} />,
            label: "Invoice",
            value: `#${invoice.invoiceNumber}`,
          },
          {
            icon: <ChevronRight size={13} />,
            label: "GRN",
            value: grn ? `#${grn.grnNumber}` : "No GRN",
            muted: !grn,
          },
          {
            icon: <CircleDollarSignIcon size={13} />,
            label: "Payable Subtotal",
            value: currency(payableSubtotal),
          },
          {
            icon:
              isGrnPosted && allLinesMatch ? (
                <CheckCircle2 size={13} className="text-emerald-500" />
              ) : (
                <AlertCircle size={13} className="text-amber-500" />
              ),
            label: "Match Status",
            value: isGrnPosted && allLinesMatch ? "All Lines Matched" : "Review Needed",
            accent: isGrnPosted && allLinesMatch ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
          },
        ].map((cell, i) => (
          <div key={i} className="flex items-center gap-2 bg-card px-4 py-3">
            <span className="shrink-0 text-muted-foreground">{cell.icon}</span>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {cell.label}
              </div>
              <div
                className={`mt-0.5 truncate text-xs font-semibold ${
                  cell.accent ?? (cell.muted ? "italic text-muted-foreground" : "text-foreground")
                }`}
              >
                {cell.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Expanded body ── */}
      {isExpanded && (
        <div className="space-y-4 p-4 sm:p-5">
          {/* GRN draft warning */}
          {!isGrnPosted && grn && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/40 dark:text-amber-400">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>
                Goods Receipt <strong>{grn.grnNumber}</strong> is still in{" "}
                <strong>DRAFT</strong>. Post it to finalize this match.
              </span>
            </div>
          )}

          {/* Payment summary for History */}
          {(isPaid || isPartiallyPaid) && thisInvoicePayments.length > 0 && (
            <PaymentSummaryPanel
              invoiceTotal={invoiceTotal}
              payments={thisInvoicePayments}
              balanceRemaining={invoice.balanceRemaining}
            />
          )}

          {/* Outstanding balance callout */}
          {isPartiallyPaid && balanceRemaining > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-amber-200/50 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                <Clock size={14} />
                <span>
                  Outstanding balance:{" "}
                  <strong>{currency(balanceRemaining)}</strong> remaining
                </span>
              </div>
              <StatusBadge status="PARTIALLY_PAID" />
            </div>
          )}

          {/* ── Mobile line cards ── */}
          <div className="space-y-3 hidden">
            {rowsWithState.map((row: any) => {
              const linePaid = row._paid === true;
              const lineUnpaid = row._paid === false;

              return (
                <div
                  key={row.key}
                  className={`rounded-xl border p-4 ${
                    linePaid || isPaid
                      ? "border-emerald-200/50 bg-emerald-500/5"
                      : lineUnpaid
                      ? "border-amber-200/50 bg-amber-500/5"
                      : "border-border/60 bg-card"
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground">{row.name}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {[row.sku, row.unit].filter(Boolean).join(" · ")}
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={linePaid || isPaid || !!checkedLines[row.key]}
                      disabled={linePaid || isPaid}
                      onChange={(e) =>
                        setCheckedLines((prev) => ({
                          ...prev,
                          [row.key]: e.target.checked,
                        }))
                      }
                      className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        PO Qty
                      </div>
                      <div className="font-medium text-foreground">{row.poQty}</div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Recv Qty
                      </div>
                      <div className="font-medium text-foreground">{row.grQty ?? "—"}</div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Unit Price
                      </div>
                      <div className="font-medium text-foreground">
                        {row.invUnitPrice == null ? "—" : currency(row.invUnitPrice)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Pay Qty
                      </div>
                      <div className="font-medium text-foreground">{row.payableQty}</div>
                    </div>

                    <div className="col-span-2">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Payable
                      </div>
                      <div className="font-bold text-foreground">
                        {currency(row.payableAmount)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    {linePaid || isPaid ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/50 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900/40 dark:text-emerald-400">
                        <CheckCircle2 size={11} /> Paid
                      </span>
                    ) : row.lineOk ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-blue-200/50 bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:border-blue-900/40 dark:text-blue-400">
                        <CheckCircle2 size={11} /> Matched
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/50 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:border-amber-900/40 dark:text-amber-400">
                        <AlertCircle size={11} /> {row.notes}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {rows.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No match rows to display.
              </div>
            )}
          </div>

          {/* ── Desktop lines table ── */}
          <div className="hidden overflow-x-auto rounded-xl border border-border/60 lg:block">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="w-8 py-2.5 pl-4 pr-3" />
                  {["Item", "PO Qty", "Recv Qty", "Unit Price", "Pay Qty", "Payable", "Status"].map(
                    (h) => (
                      <th
                        key={h}
                        className="py-2.5 pr-4 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {rowsWithState.map((row: any) => {
                  const linePaid = row._paid === true;
                  const lineUnpaid = row._paid === false;

                  return (
                    <tr
                      key={row.key}
                      className={`transition-colors ${
                        linePaid || isPaid
                          ? "bg-emerald-500/5"
                          : lineUnpaid
                          ? "bg-amber-500/5"
                          : "hover:bg-muted/20"
                      }`}
                    >
                      <td className="py-3 pl-4 pr-3">
                        <input
                          type="checkbox"
                          checked={linePaid || isPaid || !!checkedLines[row.key]}
                          disabled={linePaid || isPaid}
                          onChange={(e) =>
                            setCheckedLines((prev) => ({
                              ...prev,
                              [row.key]: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded border-border accent-primary"
                        />
                      </td>

                      <td className="py-3 pr-4">
                        <div className="font-semibold text-foreground">{row.name}</div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {[row.sku, row.unit].filter(Boolean).join(" · ")}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{row.poQty}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{row.grQty ?? "—"}</td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {row.invUnitPrice == null ? "—" : currency(row.invUnitPrice)}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{row.payableQty}</td>
                      <td className="py-3 pr-4 font-bold text-foreground">
                        {currency(row.payableAmount)}
                      </td>
                      <td className="py-3 pr-4">
                        {linePaid || isPaid ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/50 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900/40 dark:text-emerald-400">
                            <CheckCircle2 size={11} /> Paid
                          </span>
                        ) : row.lineOk ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-200/50 bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:border-blue-900/40 dark:text-blue-400">
                            <CheckCircle2 size={11} /> Matched
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/50 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:border-amber-900/40 dark:text-amber-400">
                            <AlertCircle size={11} /> {row.notes}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                      No match rows to display.
                    </td>
                  </tr>
                )}
              </tbody>

              {rows.length > 0 && (
                <tfoot>
                  <tr className="border-t border-border/60 bg-muted/10">
                    <td colSpan={5} />
                    <td className="py-3 pr-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Payable Subtotal
                    </td>
                    <td className="py-3 pr-4 text-sm font-bold text-foreground">
                      {currency(payableSubtotal)}
                    </td>
                    <td />
                  </tr>

                  <tr className="border-t border-border/60 bg-muted/10">
                    <td colSpan={5} />
                    <td className="py-3 pr-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Tax
                    </td>
                    <td className="py-3 pr-4 text-sm font-semibold text-foreground">
                      {currency(payableTax)}
                    </td>
                    <td />
                  </tr>

                  <tr className="border-t border-border/60 bg-muted/20">
                    <td colSpan={5} />
                    <td className="py-3 pr-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Final Payable Total
                    </td>
                    <td className="py-3 pr-4 text-sm font-bold text-foreground">
                      {currency(finalPayableTotal)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* ── Action footer ── */}
          <div className="flex flex-col gap-3 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              {isPaid && (
                <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={13} /> Invoice fully settled
                </span>
              )}
              {isPartiallyPaid && (
                <span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                  <Clock size={13} /> {currency(balanceRemaining)} outstanding
                </span>
              )}
              {isReadyToPay && (
                <span className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
                  <CheckCircle2 size={13} /> Approved — awaiting payment
                </span>
              )}
              {!isAlreadyApproved && canApprove && (
                <span>All lines matched · ready to approve</span>
              )}
              {!isAlreadyApproved && !canApprove && (
                <span>Resolve issues above before approving</span>
              )}
            </div>

            <div className="pt-1 sm:pt-3">
              {isPaid ? (
                // FULLY PAID — disabled
                <button
                  disabled
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200/50 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700 select-none cursor-not-allowed dark:border-emerald-900/40 dark:text-emerald-400 sm:w-auto"
                >
                  <CheckCircle2 size={15} />
                  Paid in Full
                </button>
              ) : isPartiallyPaid ? (
                // PARTIALLY PAID — pay remaining
                <PayInvoiceDialog
                  invoiceId={invoice.id}
                  invoice={invoice}
                  payment={selectedPayAmount}
                  disabled={selectedCount === 0 || isPaid}
                 triggerLabel={
                  selectedCount === 0
                    ? "Select lines to pay"
                    : `Pay Selected (${selectedCount}) — ${currency(selectedPayAmount)}`
                }
                  onSuccess={() => setCheckedLines({})} // ✅ clear checks after payment
                >
                  <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-600 active:bg-amber-700 sm:w-auto">
                    <Banknote size={15} />
                      Pay Selected ({selectedCount}) — {currency(selectedPayAmount)}
                  </button>
                </PayInvoiceDialog>
              ) : isReadyToPay ? (
                // APPROVED — pay invoice
                <PayInvoiceDialog
                  invoiceId={invoice.id}
                  invoice={invoice}
                  payment={selectedPayAmount}
                  disabled={selectedCount === 0 || isPaid}
                  triggerLabel={
                    selectedCount === 0
                      ? "Select lines to pay"
                      : `Pay Selected (${selectedCount}) — ${currency(selectedPayAmount)}`
                  }
                  onSuccess={() => setCheckedLines({})} // ✅ clear checks after payment
                />
              ) : (
                // DEFAULT — approve match
                <button
                  type="button"
                  disabled={!canApprove || isMatching || isUpdating}
                  onClick={handleApproveMatch}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-sm transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  {isMatching || isUpdating ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Approving…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      Approve Match
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}