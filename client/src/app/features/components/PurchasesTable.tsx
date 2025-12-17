// /features/purchasing/components/PurchaseTable.tsx
import { Edit3, Eye, MoreVertical, Copy } from "lucide-react";
import { PurchaseOrderDTO } from "@/app/state/api";
import StatusBadge from "./StatusBadge";
import { currency } from "../../../lib/currency";
import { EditPurchaseOrder } from "@/app/(components)/purchase-order/PurchaseOrderAction";

type Props = { data: PurchaseOrderDTO[] };

export default function PurchaseTable({ data }: Props) {
  return (
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <Th>Purchase Order</Th>
          <Th>Supplier</Th>
          <Th>Date</Th>
          <Th>Amount</Th>
          <Th>Status</Th>
          <Th>Actions</Th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y">
        {data.map((po) => (
          <tr key={po.id} className="hover:bg-gray-50">
            {/* PO Number (bold) + cuid id (muted + copy) */}
            <Td className="align-top">
              <div className="text-sm font-semibold text-ink-900">{po.poNumber}</div>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-500/80">{po.id}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(po.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600 transition hover:bg-slate-50"
                  title="Copy PO id"
                  aria-label="Copy PO id"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </button>
              </div>
            </Td>

            {/* Supplier */}
            <Td>
              <div className="flex items-center">
                <div className="mr-3 h-8 w-8 rounded-full bg-gray-200" />
                <div className="text-sm font-medium">{po.supplier?.name ?? "—"}</div>
              </div>
            </Td>

            {/* Dates */}
            <Td>
              <div className="text-sm">{formatDate(po.orderDate)}</div>
              <div className="text-xs text-gray-500">
                Due: {po.dueDate ? formatDate(po.dueDate) : "—"}
              </div>
            </Td>

            {/* Amount */}
            <Td>
              <div className="text-sm font-medium">{currency(po.total)}</div>
              <div className="text-xs text-gray-500">{po.items.length} items</div>
            </Td>

            {/* Status */}
            <Td>
              <StatusBadge status={po.status} />
            </Td>

            {/* Actions  actions taken will map to a server actions folder containing the actions */}
            <Td className="text-right">
              <div className="flex justify-end gap-2">
                <EditPurchaseOrder purchaseOrder={po} />
              </div>
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* small helpers */
const Th = (p: any) => (
  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">{p.children}</th>
);
const Td = ({ children, className = "" }: any) => <td className={`px-6 py-4 ${className}`}>{children}</td>;
const IconBtn = (p: any) => (
  <button className="text-gray-600 transition hover:text-gray-900">{p.children}</button>
);

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toISOString().slice(0, 10);
  } catch {
    return "—";
  }
}
