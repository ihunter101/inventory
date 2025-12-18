// src/app/features/components/GoodsReceiptTable.tsx
"use client";

import Link from "next/link";
import * as React from "react";
import StatusBadge from "./StatusBadge";
import {
  GoodsReceiptDTO,
  SupplierInvoiceDTO,
  PurchaseOrderDTO,
} from "@/app/state/api";
import { toYMD } from "../../../lib/date";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  data: GoodsReceiptDTO[];
  orders: PurchaseOrderDTO[];
  invoices: SupplierInvoiceDTO[];
  onOpenMatch?: (poId: string) => void;
  onPost: (grnId: string) => void;
  postingId: string | null;
}

function Th(props: React.ThHTMLAttributes<HTMLTableCellElement>) {
  const { className, ...rest } = props;
  return (
    <th
      className={cn(
        "px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground",
        className
      )}
      {...rest}
    />
  );
}

function Td(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
  const { className, ...rest } = props;
  return <td className={cn("px-6 py-4 align-middle", className)} {...rest} />;
}

export default function GRNTable({
  data,
  orders,
  invoices,
  onOpenMatch,
  onPost,
  postingId = null,
}: Props) {
  const getPO = (id?: string) => orders.find((p) => p.id === id);
  const getInv = (id?: string) => invoices.find((i) => i.id === id);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr className="border-b border-border">
            <Th>GRN</Th>
            <Th>Purchase Ord / Invoice</Th>
            <Th>Date</Th>
            <Th>Lines</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border bg-background">
          {data.map((grn) => {
            const po = getPO(grn.poId);
            const inv = getInv(grn.invoiceId);
            const canPost = grn.status === "DRAFT";
            const isPosting = postingId === grn.id;

            return (
              <tr key={grn.id} className="hover:bg-muted/30">
                <Td className="font-medium">{grn.grnNumber}</Td>

                <Td>
                  <div className="space-y-1">
                    <div>
                      <span className="text-muted-foreground">PO: </span>
                      {po?.poNumber ? (
                        <Link
                          className="font-medium text-primary hover:underline"
                          href={`/purchases?po=${po.id}`}
                          onClick={() => onOpenMatch?.(po.id)}
                        >
                          {po.poNumber}
                        </Link>
                      ) : (
                        <span className="font-medium">{grn.poId}</span>
                      )}
                    </div>

                    <div>
                      <span className="text-muted-foreground">Invoice: </span>
                      {inv?.id ? (
                        <Link
                          className="font-medium text-primary hover:underline"
                          href={`/purchases?tab=invoices`}
                        >
                          {inv.invoiceNumber}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                </Td>

                <Td className="text-muted-foreground">{toYMD(grn.date)}</Td>
                <Td className="text-muted-foreground">{grn.lines.length}</Td>

                <Td>
                  <StatusBadge status={grn.status} />
                </Td>

                <Td className="text-right">
                  {canPost ? (
                    <Button
                      size="sm"
                      onClick={() => onPost(grn.id)}
                      disabled={isPosting}
                    >
                      {isPosting ? "Posting..." : "Post"}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
