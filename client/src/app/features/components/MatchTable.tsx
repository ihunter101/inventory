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
  CreditCard,
  Hash,
  Calendar,
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
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-5 w-1 rounded-full bg-zinc-900" />
          <div className="text-base font-bold tracking-tight text-zinc-900">
            Three-Way Match Dashboard
          </div>
        </div>
        <div className="text-sm text-zinc-500 mb-4">
          Reviewing:{" "}
          <span className="font-semibold text-zinc-800">
            {po?.poNumber ?? "Select a Purchase Order"}
          </span>
        </div>

        <select
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-shadow"
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
          <p className="mt-3 text-sm text-zinc-400">
            Please select a Purchase Order to view matches.
          </p>
        )}
        {currentPOId && relatedInvoices.length === 0 && (
          <p className="mt-3 text-sm text-zinc-400">
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

  const { data: rawPayments = [] } = useGetPoInvoicePaymentsQuery
  ({ id: po!.id},
    {skip: !po?.id}
   );

   const paymentsArray = Array.isArray(rawPayments) 
    ? rawPayments 
    : (rawPayments as any)?.payments ?? (rawPayments as any)?.data ?? [];

  const thisInvoicePayments: PaymentRecord[] = useMemo(
    () => paymentsArray
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
    [rawPayments, invoice.id]
  );

  const rows = useMemo(() => {
    if (!po) return [];
    return buildMatchRows(po, invoice, grn);
  }, [po, invoice, grn]);

  const isGrnPosted = grn?.status === "POSTED";
  const allLinesMatch = rows.length > 0 && rows.every((r) => r.lineOk);
  const payableTotal = rows.reduce((acc, r) => acc + (r.payableAmount || 0), 0);
  const invoiceTotal = Number(invoice.amount ?? 0);
  const balanceRemaining = invoice.balanceRemaining != null
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
    : "border-l-4 border-l-zinc-200";

  return (
    <div className={`rounded-xl border bg-white shadow-sm overflow-hidden ${accentBorder}`}>

      {/* ── Header row ── */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-zinc-50/70 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded
            ? <ChevronDown size={16} className="text-zinc-400 shrink-0" />
            : <ChevronRight size={16} className="text-zinc-400 shrink-0" />}
          <div>
            <div className="text-sm font-bold text-zinc-900">
              Invoice #{invoice.invoiceNumber}
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">{invoiceDate}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-zinc-400 uppercase tracking-widest">Amount</div>
            <div className="text-sm font-bold text-zinc-800">{currency(invoiceTotal)}</div>
          </div>
          <StatusBadge status={invoice.status} />
        </div>
      </button>

      {/* ── Meta strip ── */}
      <div className="grid grid-cols-2 gap-px bg-zinc-100 border-t border-b md:grid-cols-4">
        {[
          { icon: <FileText size={13} />, label: "Invoice", value: `#${invoice.invoiceNumber}` },
          {
            icon: <ChevronRight size={13} />,
            label: "GRN",
            value: grn ? `#${grn.grnNumber}` : "No GRN",
            muted: !grn,
          },
          {
            icon: <CircleDollarSignIcon size={13} />,
            label: "Payable Total",
            value: currency(payableTotal),
          },
          {
            icon: isGrnPosted && allLinesMatch
              ? <CheckCircle2 size={13} className="text-emerald-500" />
              : <AlertCircle size={13} className="text-amber-500" />,
            label: "Match Status",
            value: isGrnPosted && allLinesMatch ? "All Lines Matched" : "Review Needed",
            accent: isGrnPosted && allLinesMatch ? "text-emerald-700" : "text-amber-700",
          },
        ].map((cell, i) => (
          <div key={i} className="flex items-center gap-2 bg-white px-4 py-3">
            <span className="text-zinc-400 shrink-0">{cell.icon}</span>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                {cell.label}
              </div>
              <div
                className={`text-xs font-semibold mt-0.5 ${
                  cell.accent ?? (cell.muted ? "text-zinc-400 italic" : "text-zinc-800")
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
        <div className="p-5 space-y-4">

          {/* GRN draft warning */}
          {!isGrnPosted && grn && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>
                Goods Receipt <strong>{grn.grnNumber}</strong> is still in{" "}
                <strong>DRAFT</strong>. Post it to finalize this match.
              </span>
            </div>
          )}

          {/* Payment summary */}
          {(isPaid || isPartiallyPaid) && thisInvoicePayments.length > 0 && (
            <PaymentSummaryPanel
              invoiceTotal={invoiceTotal}
              payments={thisInvoicePayments}
              balanceRemaining={invoice.balanceRemaining}
            />
          )}

          {/* Outstanding balance callout */}
          {isPartiallyPaid && balanceRemaining > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-800 text-sm">
                <Clock size={14} />
                <span>
                  Outstanding balance:{" "}
                  <strong>{currency(balanceRemaining)}</strong> remaining
                </span>
              </div>
              <StatusBadge status="PARTIALLY_PAID" />
            </div>
          )}

          {/* ── Lines table ── */}
          <div className="overflow-x-auto rounded-xl border border-zinc-100">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100">
                  <th className="py-2.5 pl-4 pr-3 w-8" />
                  {["Item", "PO Qty", "Recv Qty", "Unit Price", "Pay Qty", "Payable", "Status"].map(
                    (h) => (
                      <th
                        key={h}
                        className="py-2.5 pr-4 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {rowsWithState.map((row) => {
                  const linePaid = (row as any)._paid === true;
                  const lineUnpaid = (row as any)._paid === false;

                  return (
                    <tr
                      key={row.key}
                      className={`transition-colors ${
                        linePaid || isPaid
                          ? "bg-emerald-50/30"
                          : lineUnpaid
                          ? "bg-amber-50/30"
                          : "hover:bg-zinc-50/60"
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
                          className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
                        />
                      </td>

                      <td className="py-3 pr-4">
                        <div className="font-semibold text-zinc-800">{row.name}</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          {[row.sku, row.unit].filter(Boolean).join(" · ")}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-zinc-600">{row.poQty}</td>
                      <td className="py-3 pr-4 text-zinc-600">{row.grQty ?? "—"}</td>
                      <td className="py-3 pr-4 text-zinc-600">
                        {row.invUnitPrice == null ? "—" : currency(row.invUnitPrice)}
                      </td>
                      <td className="py-3 pr-4 text-zinc-600">{row.payableQty}</td>
                      <td className="py-3 pr-4 font-bold text-zinc-900">
                        {currency(row.payableAmount)}
                      </td>
                      <td className="py-3 pr-4">
                        {linePaid || isPaid ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 size={11} /> Paid
                          </span>
                        ) : row.lineOk ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                            <CheckCircle2 size={11} /> Matched
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                            <AlertCircle size={11} /> {row.notes}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-sm text-zinc-400">
                      No match rows to display.
                    </td>
                  </tr>
                )}
              </tbody>

              {rows.length > 0 && (
                <tfoot>
                  <tr className="bg-zinc-50 border-t-2 border-zinc-200">
                    <td colSpan={5} />
                    <td className="py-3 pr-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      Total
                    </td>
                    <td className="py-3 pr-4 font-bold text-zinc-900 text-sm">
                      {currency(payableTotal)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* ── Action footer ── */}
          <div className="flex items-center justify-between pt-1 border-t border-zinc-100">
            <div className="text-xs text-zinc-400">
              {isPaid && (
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 size={13} /> Invoice fully settled
                </span>
              )}
              {isPartiallyPaid && (
                <span className="flex items-center gap-1 text-amber-600 font-medium">
                  <Clock size={13} /> {currency(balanceRemaining)} outstanding
                </span>
              )}
              {isReadyToPay && (
                <span className="flex items-center gap-1 text-blue-600 font-medium">
                  <CheckCircle2 size={13} /> Approved — awaiting payment
                </span>
              )}
              {!isAlreadyApproved && canApprove && (
                <span className="text-zinc-500">All lines matched · ready to approve</span>
              )}
              {!isAlreadyApproved && !canApprove && (
                <span className="text-zinc-400">Resolve issues above before approving</span>
              )}
            </div>

            <div className="pt-3">
              {isPaid ? (
                // FULLY PAID — disabled
                <button
                  disabled
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-600 cursor-not-allowed select-none"
                >
                  <CheckCircle2 size={15} />
                  Paid in Full
                </button>
              ) : isPartiallyPaid ? (
                // PARTIALLY PAID — pay remaining
                <PayInvoiceDialog invoiceId={invoice.id} invoice={invoice}>
                  <button className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors">
                    <Banknote size={15} />
                    Pay Remaining {currency(balanceRemaining)}
                  </button>
                </PayInvoiceDialog>
              ) : isReadyToPay ? (
                // APPROVED — pay invoice
                <PayInvoiceDialog invoiceId={invoice.id} invoice={invoice} />
              ) : (
                // DEFAULT — approve match
                <button
                  type="button"
                  disabled={!canApprove || isMatching || isUpdating}
                  onClick={handleApproveMatch}
                  className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 hover:bg-zinc-700 active:bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isMatching || isUpdating ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
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




