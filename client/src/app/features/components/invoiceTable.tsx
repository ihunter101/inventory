// client/sr/app/features/components/invoicetable.tsx
"use client";

import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { GoodsReceiptDTO, SupplierInvoiceDTO } from "@/app/state/api";
import { InvoiceActions } from "@/app/(components)/invoices/InvoiceActions";

type Props = {
  data: SupplierInvoiceDTO[];
  goodsReceipts: GoodsReceiptDTO[];
  onCreateGRN: (inv: SupplierInvoiceDTO) => void;
  onOpenMatch?: (poId?: string) => void;
};

const fmt = (iso?: string) => (iso ? iso.slice(0, 10) : "-");

function shortId(id?: string) {
  return id ? `${id.slice(0, 8)}…` : "-";
}

export default function InvoiceTable({
  data,
  goodsReceipts,
  onCreateGRN,
  onOpenMatch,
}: Props) {
  const hasGRNFor = (inv: SupplierInvoiceDTO) =>
    goodsReceipts.some((g) => g.invoiceId === inv.id);

  return (
    <div className="w-full">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <Th>Invoice</Th>
            <Th>Supplier</Th>
            <Th>PO</Th>
            <Th>Date</Th>
            <Th>Amount</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((inv) => {
            const grnExists = hasGRNFor(inv);
            const poLabel = inv.poNumber || shortId(inv.poId);
            const hasPO = Boolean(inv.poId);
            return (
              <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                <Td className="font-medium text-foreground">{inv.invoiceNumber}</Td>
                <Td className="text-foreground">{inv.supplier}</Td>
                <Td>
                  {hasPO ? (
                    <Link
                      href={`/purchases?tab=match&po=${encodeURIComponent(inv.poId!)}&inv=${encodeURIComponent(inv.id)}`}
                      className="text-primary hover:underline"
                      title={`Open PO ${poLabel}`}
                      onClick={() => onOpenMatch?.(inv.poId)}

                    >
                      {poLabel}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </Td>
                <Td className="text-sm text-foreground">{fmt(inv.date)}</Td>
                <Td className="text-sm text-foreground">
                  ${Number(inv.amount ?? 0).toFixed(2)}
                </Td>
                <Td className="text-sm">
                  <Link
                    href={`/purchases?tab=invoices&status=${encodeURIComponent(
                      inv.status.toLowerCase()
                    )}`}
                    title={`View ${inv.status.toLowerCase()} invoices`}
                    className="inline-flex"
                  >
                    <StatusBadge status={inv.status as any} />
                  </Link>
                </Td>
                {/* <Td className="text-right">
                  {!grnExists && hasPO && (
                    <button
                      className="text-primary hover:underline font-medium"
                      onClick={() => onCreateGRN(inv)}
                    >
                      Create GRN
                    </button>
                  )}
                </Td> */}
                <td className="text-right">
                  <div className="flex items-center">
                    <InvoiceActions 
                      supplierInvoice={inv} 
                      goodsReceipt={goodsReceipts}
                      onCreateGRN={onCreateGRN}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const Th = (p: any) => (
  <th
    className={`px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground ${
      p.className ?? ""
    }`}
  >
    {p.children}
  </th>
);
const Td = (p: any) => (
  <td className={`px-6 py-4 ${p.className ?? ""}`}>{p.children}</td>
);

