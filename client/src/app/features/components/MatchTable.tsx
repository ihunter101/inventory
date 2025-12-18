"use client";

import { PRICE_TOLERANCE } from "../../../lib/matching";
import {
  GoodsReceiptDTO,
  SupplierInvoiceDTO,
  PurchaseOrderDTO,
} from "@/app/state/api";
import StatusBadge from "./StatusBadge";
import { currency } from "../../../lib/currency";
import buildMatchRows from "@/lib/matching";

type Props = {
  po?: PurchaseOrderDTO;
  invoice?: SupplierInvoiceDTO;
  grn?: GoodsReceiptDTO;
  allPOs: PurchaseOrderDTO[];
  currentPOId?: string | null;
  onChangePO: (poId: string) => void;
};

export default function MatchTable({
  po,
  invoice,
  grn,
  allPOs,
  currentPOId,
  onChangePO,
}: Props) {
  const rows = buildMatchRows(po, invoice, grn);

  const posted = grn?.status === "POSTED";
  const allLinesMatch = rows.length > 0 && rows.every((r) => r.lineOk);
  const allOk = posted && allLinesMatch;

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Three-way Match</h3>
          <p className="text-sm text-muted-foreground">
            PO <b>{po?.poNumber ?? po?.id ?? "-"}</b> • Invoice{" "}
            <b>{invoice?.invoiceNumber ?? "-"}</b> • GRN{" "}
            <b>{grn?.grnNumber ?? "-"}</b>
          </p>
        </div>
        <select
          className="rounded border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          value={currentPOId ?? ""}
          onChange={(e) => onChangePO(e.target.value)}
        >
          <option value="" disabled>
            Select PO to match
          </option>
          {allPOs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.poNumber ?? p.id} — {p.supplier?.supplierId}
            </option>
          ))}
        </select>
      </div>

      <div className={`mb-4 rounded-lg p-3 ${
        allOk 
          ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" 
          : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"
      }`}>
        {allOk
          ? "All lines match and GRN is posted. Safe to pay."
          : posted
          ? "Some lines don't match. Please review."
          : "GRN not posted. Please post the GRN to finalize the match."}
      </div>

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <Th>Item</Th>
              <Th>Unit</Th>
              <Th>Purchase Order Qty</Th>
              <Th>Invoice Qty</Th>
              <Th>Goods Reciepts Qty</Th>
              <Th>Purchase Order Price</Th>
              <Th>Invoice Price</Th>
              <Th>Status</Th>
              <Th>Notes</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const rowOk = r.lineOk && posted;
              const notes =
                !posted && r.lineOk
                  ? "GRN not posted"
                  : r.notes ?? "";
              return (
                <tr key={r.key} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <Td>
                    <div className="font-medium text-foreground">{r.sku ?? "-"}</div>
                    <div className="text-muted-foreground">{r.name}</div>
                  </Td>
                  <Td>{r.unit ?? "-"}</Td>
                  <Td>{r.poQty ?? "-"}</Td>
                  <Td>{r.invQty ?? "-"}</Td>
                  <Td>{r.grQty ?? "-"}</Td>
                  <Td>{r.poPrice != null ? currency(r.poPrice) : "-"}</Td>
                  <Td>{r.invPrice != null ? currency(r.invPrice) : "-"}</Td>
                  <Td>
                    <StatusBadge status={rowOk ? "POSTED" : "PENDING"} />
                  </Td>
                  <Td className="text-rose-600 dark:text-rose-400">{notes}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Tip: allow a small unit price tolerance (e.g., ±$
        {PRICE_TOLERANCE.toFixed(2)}) and support partial receipts. Rows only
        become OK after the GRN is <b>posted</b>.
      </p>
    </div>
  );
}

const Th = (p: any) => (
  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">
    {p.children}
  </th>
);
const Td = (p: any) => <td className="px-4 py-2 text-sm text-foreground">{p.children}</td>;