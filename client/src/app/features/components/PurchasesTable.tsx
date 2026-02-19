// /features/purchasing/components/PurchaseTable.tsx
"use client";

import { Copy } from "lucide-react";
import { PurchaseOrderDTO } from "@/app/state/api";
import StatusBadge from "./StatusBadge";
import { currency } from "../../../lib/currency";
import { EditPurchaseOrder } from "@/app/(components)/purchase-order/PurchaseOrderAction";

import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

type Props = { data: PurchaseOrderDTO[] };

export default function PurchaseTable({ data }: Props) {
  return (
    <div className="w-full">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <Th>Purchase Order</Th>
            <Th>Supplier</Th>
            <Th>Date</Th>
            <Th>Amount</Th>
            <Th>Status</Th>
            <Th>Invoices</Th>
            <Th>Actions</Th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {data.map((po) => {
            const invoiceCount = po.invoiceCount ?? 0;
            const remainingLines = po.remainingToInvoiceCount ?? 0;
            const remainingQty = po.remainingToInvoiceQty ?? 0;

            // Status cue for the chip
            const variant =
              remainingLines > 0 ? "secondary" : invoiceCount > 0 ? "default" : "outline";

            return (
              <tr key={po.id} className="hover:bg-muted/30 transition-colors">
                {/* PO Number + id copy */}
                <Td className="align-top">
                  <div className="text-sm font-semibold text-foreground">{po.poNumber}</div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-[11px] font-mono text-muted-foreground">{po.id}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(po.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground transition hover:bg-muted hover:text-foreground"
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
                    <div className="mr-3 h-8 w-8 rounded-full bg-muted" />
                    <div className="text-sm font-medium text-foreground">
                      {po.supplier?.name ?? "—"}
                    </div>
                  </div>
                </Td>

                {/* Dates */}
                <Td>
                  <div className="text-sm text-foreground">{formatDate(po.orderDate)}</div>
                  <div className="text-xs text-muted-foreground">
                    Due: {po.dueDate ? formatDate(po.dueDate) : "—"}
                  </div>
                </Td>

                {/* Amount */}
                <Td>
                  <div className="text-sm font-medium text-foreground">{currency(po.total)}</div>
                  <div className="text-xs text-muted-foreground">{po.items.length} items</div>
                </Td>

                {/* Status */}
                <Td>
                  <StatusBadge status={po.status} />
                </Td>

                {/* ✅ Invoices (hover details) */}
                <Td>
                  <HoverCard openDelay={120} closeDelay={80}>
                    <HoverCardTrigger asChild>
                      <button className="inline-flex">
                        <Badge variant={variant as any} className="rounded-full">
                          {invoiceCount} {invoiceCount === 1 ? "invoice" : "invoices"}
                        </Badge>
                      </button>
                    </HoverCardTrigger>

                    <HoverCardContent className="w-80 rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900">
                            {po.poNumber}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {po.supplier?.name ?? po.supplierId}
                          </div>
                        </div>

                        <Badge variant="outline" className="rounded-full">
                          {po.status}
                        </Badge>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <Metric label="Invoices" value={invoiceCount} />
                        <Metric label="Remaining lines" value={remainingLines} />
                        <Metric label="Remaining qty" value={remainingQty} />
                      </div>

                      <div className="mt-3 text-xs text-slate-500">
                        {remainingLines > 0
                          ? "This PO can still be invoiced for remaining items."
                          : "All PO lines are fully invoiced."}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </Td>

                {/* Actions */}
                <Td className="text-center">
                  <div className="flex justify-end gap-2">
                    <EditPurchaseOrder purchaseOrder={po} />
                  </div>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* small helpers */
const Th = (p: any) => (
  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
    {p.children}
  </th>
);

const Td = ({ children, className = "" }: any) => (
  <td className={`px-6 py-4 ${className}`}>{children}</td>
);

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-900 tabular-nums">{value}</div>
    </div>
  );
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toISOString().slice(0, 10);
  } catch {
    return "—";
  }
}
