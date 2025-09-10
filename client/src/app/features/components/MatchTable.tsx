// /features/purchasing/components/MatchTable.tsx
import { PRICE_TOLERANCE } from "../../../lib/matching";
import { GoodsReceiptDTO, SupplierInvoiceDTO, PurchaseOrderDTO } from "@/app/state/api";
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

export default function MatchTable({ po, invoice, grn, allPOs, currentPOId, onChangePO }: Props) {
  const rows = buildMatchRows(po, invoice, grn);
  const allOk = rows.length > 0 && rows.every((r) => r.lineOk);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Three-way Match</h3>
          <p className="text-sm text-gray-600">
            PO <b>{po?.id ?? "-"}</b> • Invoice <b>{invoice?.invoiceNumber ?? "-"}</b> • GRN <b>{grn?.grnNumber ?? "-"}</b>
          </p>
        </div>
        <select
          className="border rounded px-3 py-2"
          value={currentPOId ?? ""}
          onChange={(e) => onChangePO(e.target.value)}
        >
          <option value="" disabled>Select PO to match</option>
          {allPOs.map((p) => (
            <option key={p.id} value={p.id}>{p.id} — {p.supplier}</option>
          ))}
        </select>
      </div>

      <div className={`mb-4 ${allOk ? "text-green-700" : "text-yellow-700"}`}>
        {allOk ? "All lines match. Safe to pay." : "Some lines don’t match. Please review."}
      </div>

      <div className="border rounded overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <Th>SKU / Item</Th><Th>UOM</Th><Th>PO Qty</Th><Th>Inv Qty</Th><Th>GRN Qty</Th>
              <Th>PO Price</Th><Th>Inv Price</Th><Th>OK?</Th><Th>Notes</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t hover:bg-gray-50">
                <Td>
                  <div className="font-medium">{r.sku ?? "-"}</div>
                  <div className="text-gray-600">{r.name}</div>
                </Td>
                <Td>{r.unit ?? "-"}</Td>
                <Td>{r.poQty ?? "-"}</Td>
                <Td>{r.invQty ?? "-"}</Td>
                <Td>{r.grQty ?? "-"}</Td>
                <Td>{r.poPrice != null ? currency(r.poPrice) : "-"}</Td>
                <Td>{r.invPrice != null ? currency(r.invPrice) : "-"}</Td>
                <Td>{r.lineOk ? <StatusBadge status="posted" /> : <StatusBadge status="pending" />}</Td>
                <Td className="text-red-600">{r.notes ?? ""}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Tip: allow a small unit price tolerance (e.g., ±${PRICE_TOLERANCE.toFixed(2)}) and support partial receipts.
      </p>
    </div>
  );
}

const Th = (p: any) => <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{p.children}</th>;
const Td = (p: any) => <td className="px-4 py-2 text-sm">{p.children}</td>;
