"use client";

import {
  GoodsReceiptDTO,
  SupplierInvoiceDTO,
  PurchaseOrderDTO,
  useCreateMatchMutation,
  useUpdateInvoiceStatusMutation,
  useGetAllPoPaymentsSummaryQuery,
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
} from "lucide-react";
import { toast } from "sonner";
import { PayInvoiceDialog } from "@/app/(components)/payments/PaymentDialog";

type Props = {
  po?: PurchaseOrderDTO;
  relatedInvoices: SupplierInvoiceDTO[];
  relatedGRNs: GoodsReceiptDTO[];
  allPOs: PurchaseOrderDTO[];
  currentPOId?: string | null;
  onChangePO: (poId: string) => void;
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
      <div className="rounded-lg border p-4">
        <div className="text-xl font-semibold">Three-way Match Dashboard</div>
        <div className="text-sm text-muted-foreground">
          Reviewing Purchase Order: {po?.poNumber ?? "Select a PO"}
        </div>

        <div className="mt-3">
          <select
            className="w-full rounded-md border px-3 py-2"
            value={currentPOId ?? ""}
            onChange={(e) => onChangePO(e.target.value)}
          >
            <option value="" disabled>
              Select PO to match
            </option>
            {allPOs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.poNumber ?? p.id} — {p.supplier?.name ?? "Unknown supplier"}
              </option>
            ))}
          </select>
        </div>

        {!currentPOId && (
          <div className="mt-3 text-sm text-muted-foreground">
            Please select a Purchase Order to view matches.
          </div>
        )}

        {currentPOId && relatedInvoices.length === 0 && (
          <div className="mt-3 text-sm text-muted-foreground">
            No invoices found for this Purchase Order yet.
          </div>
        )}
      </div>

      {/* Match cards per invoice */}
      <div className="space-y-4">
        {relatedInvoices.map((invoice) => {
          const matchingGRN = relatedGRNs.find((g) => g.invoiceId === invoice.id);
          return (
            <MatchCard
              key={invoice.id}
              po={po}
              invoice={invoice}
              grn={matchingGRN}
            />
          );
        })}
      </div>
    </div>
  );
}

// --- Sub Component: Individual Invoice Match Card ---
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

  // Track which rows user checks (optional UI feature)
  const [checkedLines, setCheckedLines] = useState<Record<string, boolean>>({});

  const [createMatch, { isLoading: isMatching }] = useCreateMatchMutation();
  const [updateInvoiceStatus, { isLoading: isUpdating }] =
    useUpdateInvoiceStatusMutation();

  const { data: invoicePayment, isLoading } = useGetAllPoPaymentsSummaryQuery()
  console.log("invoicePayment:", invoicePayment, "isArray:", Array.isArray(invoicePayment));


  const currentInvoicePayment = invoicePayment?.find((p: any ) => p.invoiceId === invoice.id )
  

  const rows = useMemo(() => {
    if (!po) return [];
    return buildMatchRows(po, invoice, grn);
  }, [po, invoice, grn]);

  const isGrnPosted = grn?.status === "POSTED";
  const allLinesMatch = rows.length > 0 && rows.every((r) => r.lineOk);
  const payableTotal = rows.reduce((acc, r) => acc + (r.payableAmount || 0), 0);

  const isAlreadyApproved =
  invoice.status === "READY_TO_PAY" ||
  invoice.status === "PARTIALLY_PAID" ||
  invoice.status === "PAID";


  const canApprove = !!po && !!grn && isGrnPosted && allLinesMatch && !isAlreadyApproved;

  const handleApproveMatch = async () => {
    if (!po || !grn) return;

    try {
      await createMatch({
        poId: po.id,
        invoiceId: invoice.id,
        grnId: grn.id,
      }).unwrap();

      await updateInvoiceStatus({
        id: invoice.id,
        status: "READY_TO_PAY",
      }).unwrap();

      toast.success("Successfully created a match.");
    } catch (error) {
      console.error("Failed to approve match", error);
      toast.error("Failed to approve match.");
    }
  };

  const invoiceDate =
    invoice.date ? new Date(invoice.date).toLocaleDateString() : "No date";

  return (
    <div className="rounded-lg border">
      {/* Card Header */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <div className="font-semibold">Invoice #{invoice.invoiceNumber}</div>
        </div>

        {invoice.status === "PAID" ? (
          <div className="text-sm text-muted-foreground">{currentInvoicePayment?.paidAt} • total: {currency(Number(invoice.balanceRemaining ?? 0))}</div>
        ) : (
          <div className="text-sm text-muted-foreground">
          {invoiceDate} • Total: {currency(Number(invoice.amount ?? 0))}
        </div>
        )}
      </button>

      {/* Connection summary */}
      <div className="grid grid-cols-1 gap-3 border-t p-4 md:grid-cols-4">
        <div className="flex items-center gap-2">
          <FileText size={18} />
          <div>
            <div className="text-xs text-muted-foreground">Invoice</div>
            <div className="font-medium">#{invoice.invoiceNumber}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ChevronRight size={18} />
          <div>
            <div className="text-xs text-muted-foreground">GRN</div>
            <div className="font-medium">
              {grn ? `#${grn.grnNumber}` : "No GRN"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CircleDollarSignIcon size={18} />
          <div>
            <div className="text-xs text-muted-foreground">Payable Amount</div>
            <div className="font-medium">{currency(payableTotal)}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isGrnPosted && allLinesMatch ? (
            <>
              <CheckCircle2 size={18} className="text-green-600" />
              <div className="font-medium text-green-700">{invoice.status}</div>
            </>
          ) : (
            <>
              <AlertCircle size={18} className="text-amber-600" />
              <div className="font-medium text-amber-700">Review Needed</div>
            </>
          )}
        </div>
      </div>

      {/* Card Body */}
      {isExpanded && (
        <div className="border-t p-4 space-y-3">
          {!isGrnPosted && grn && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
              ⚠️ The Goods Receipt ({grn.grnNumber}) is currently in DRAFT. Post it to
              finalize this match.
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Check</th>
                  <th className="py-2 pr-3">Item Details</th>
                  <th className="py-2 pr-3">PO Qty</th>
                  <th className="py-2 pr-3">Received Qty</th>
                  <th className="py-2 pr-3">Inv Unit Price</th>
                  <th className="py-2 pr-3">Payable Qty</th>
                  <th className="py-2 pr-3">Payable</th>
                  <th className="py-2 pr-3">Match Status</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr key={row.key} className="border-t">
                    <td className="py-2 pr-3">
                      <input
                        type="checkbox"
                        checked={!!checkedLines[row.key]}
                        onChange={(e) =>
                          setCheckedLines((prev) => ({
                            ...prev,
                            [row.key]: e.target.checked,
                          }))
                        }
                      />
                    </td>

                    <td className="py-2 pr-3">
                      <div className="font-medium">{row.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.sku ? row.sku : ""}
                        {row.unit ? ` ${row.unit}` : ""}
                      </div>
                    </td>

                    <td className="py-2 pr-3">{row.poQty}</td>
                    <td className="py-2 pr-3">{row.grQty ?? "-"}</td>
                    <td className="py-2 pr-3">
                      {row.invUnitPrice == null ? "-" : currency(row.invUnitPrice)}
                    </td>
                    <td className="py-2 pr-3">{row.payableQty}</td>
                    <td className="py-2 pr-3">{currency(row.payableAmount)}</td>

                    <td className="py-2 pr-3">
                      {row.lineOk ? (
                        <span className="inline-flex items-center gap-1 text-green-700">
                          <CheckCircle2 size={16} /> Matched
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700">
                          <AlertCircle size={16} /> {row.notes}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-muted-foreground">
                      No match rows to display.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {!isAlreadyApproved ? (
              <button
                type="button"
                disabled={!canApprove || isMatching || isUpdating}
                onClick={handleApproveMatch}
                className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
              >
                {isMatching || isUpdating ? "Approving..." : "Approve Match"}
              </button>
            ) : (
              <PayInvoiceDialog invoiceId={invoice.id} invoice={invoice} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
