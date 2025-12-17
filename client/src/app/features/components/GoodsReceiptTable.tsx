// src/app/features/components/GoodsReceiptTable.tsx
"use client";

import Link from "next/link";
import StatusBadge from "./StatusBadge";
import {
  GoodsReceiptDTO,
  SupplierInvoiceDTO,
  PurchaseOrderDTO,
} from "@/app/state/api";
import { toYMD } from "../../../lib/date";
import { Button } from "@/components/ui/button";
import { gridTabIndexCellSelector } from "@mui/x-data-grid";

interface Props {
  data: GoodsReceiptDTO[];
  orders: PurchaseOrderDTO[];
  invoices: SupplierInvoiceDTO[];
  onOpenMatch?: (poId: string) => void;
  onPost:(grnId: string) => void;
  postingId: string | null;
}

export default function GRNTable({ data, orders, invoices, onOpenMatch, onPost, postingId= null }: Props) {
  const getPO = (id?: string) => orders.find((p) => p.id === id);
  const getInv = (id?: string) => invoices.find((i) => i.id === id);

  const Th = (p: any) => (
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
      {p.children}
    </th>
  );
  const Td = (p: any) => <td className="px-6 py-4">{p.children}</td>;

  return (
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <Th>GRN</Th>
          <Th>Purchase Ord / Invoice</Th>
          <Th>Date</Th>
          <Th>Lines</Th>
          <Th>Status</Th>
          <Th>Actions</Th> 
          <Th />
        </tr>
      </thead>
      <tbody className="bg-white divide-y">
        {data.map((grn) => {
          const po = getPO(grn.poId);
          const inv = getInv(grn.invoiceId);
          const canPost = grn.status === "DRAFT";
          const isPosting = postingId === grn.id;
          return (
            <tr key={grn.id} className="hover:bg-gray-50">
              <Td className="font-medium">{grn.grnNumber}</Td>

              <Td>
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500">PO: </span>
                    {po?.poNumber ? (
                      <Link
                        className="font-medium text-blue-600 hover:underline"
                        href={`/purchases?po=${po.id}`}
                        onClick={(e) => onOpenMatch?.(po.id)}
                      >
                        {po.poNumber}
                      </Link>
                    ) : (
                      <span className="font-medium">{grn.poId}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500">Invoice: </span>
                    {inv?.id ? (
                      <Link
                        className="font-medium text-blue-600 hover:underline"
                        href={`/purchases?tab=invoices`}
                      >
                        {inv.invoiceNumber}
                      </Link>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </div>
                </div>
              </Td>

              <Td className="text-sm">{toYMD(grn.date)}</Td>
              <Td className="text-sm">{grn.lines.length}</Td>
              <Td>
                <StatusBadge status={grn.status} />
              </Td>
              <Td className="text-right" />


              <Td className="px-6 py-4 text-right">
                  {canPost ? (
                    <Button
                      onClick={() => onPost?.(grn.id)}
                      disabled={!onPost || isPosting}
                      className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibod text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      {isPosting ? "Posting..": "Post"}
                    </Button>) : (
                      <span className="text-xs text-slate-500">-</span>
                  )}
              </Td>
              
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
