"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import {
  FileTextIcon,
  PackageIcon,
  ReceiptIcon,
  ArrowLeftIcon,
  ClockIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  Clock1Icon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetPurchaseOrderByIdQuery } from "@/app/state/api";

/**
 * Formats a date as a string in the format "YYYY-MM-DD"
 * Returns "-" if the date is invalid or null.
 * @param {string|Date|null} iso - The date to be formatted.
 * @returns {string} - The formatted date string.
 */
function formatDate(iso?: string | Date | null) {
  if (!iso) return "-";

  const date = typeof iso === "string" ? new Date(iso) : iso;
  if (Number(isNaN(date.getTime()))) return "-";
  return date.toISOString().slice(0, 10);
}

/**
 * Format a number as a currency string.
 * @param {any} num the number to format.
 * @returns {string} a string representing the number as a currency.
 * @example money(123.45) // returns "$123.45"
 */
function money(num?: any) {
  const v = Number(num ?? 0);
  if (!Number.isFinite(v)) return " $0.00";
  return `$${v.toFixed(2)}`;
}

function poStatusBadge(status?: string) {
  const s = String(status || "UNKNOWN");
  const map: Record<string, string> = {
    "DRAFT": "secondary",
    "SENT": "outline",
    "APPROVED": "outline",
    "PARTIALLY_RECEIVED": "default",
    "RECEIVED": "default",
    "CLOSED": "default",
  };

  const variant = (map[s] as any) ?? "secondary";
  return <Badge variant={variant}>{s}</Badge>;
}

export default function PurchaseOrderDetailsPage() {
  const params = useParams<{ poId: string }>();
  const poId = params.poId;

  const { data: purchaseOrder, isLoading, isError } = useGetPurchaseOrderByIdQuery(poId);

  const summary = useMemo(() => {
  if (!purchaseOrder) return null;

  const invoiceCount =
    purchaseOrder?._count?.invoices ?? purchaseOrder?.invoices?.length ?? 0;

  const grnCount =
    purchaseOrder?._count?.grns ?? purchaseOrder?.grns?.length ?? 0;

  const invoicedTotal = (purchaseOrder?.invoices ?? []).reduce(
    (sum: number, inv: any) => sum + Number(inv.amount ?? 0),
    0
  );

  // total received qty (easiest: sum GRN lines)
  const receivedQtyTotal = (purchaseOrder?.grns ?? [])
    .flatMap((g: any) => g.lines ?? [])
    .reduce((sum: number, ln: any) => sum + Number(ln.receivedQty ?? 0), 0);

  return { invoiceCount, grnCount, invoicedTotal, receivedQtyTotal };
}, [purchaseOrder]);



const fulfillmentRows = useMemo(() => {
  if (!purchaseOrder?.items?.length) return [];

  return purchaseOrder.items.map((it: any) => {
    const ordered = Number(it.quantity ?? 0);

    const received = (it.grnLines ?? []).reduce(
      (sum: number, gl: any) => sum + Number(gl.receivedQty ?? 0),
      0
    );

    const pending = Math.max(0, ordered - received);

    return {
      id: it.id,
      name: it.product?.name ?? it.name ?? "Unnamed Item",
      unit: it.product?.unit ?? it.unit ?? "unit",
      ordered,
      received,
      pending,
    };
  });
}, [purchaseOrder]);


const supplierName = purchaseOrder?.supplier?.name ?? "Unknown Supplier"

   if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !purchaseOrder) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="rounded-xl border bg-white p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircleIcon className="h-5 w-5" />
            <span className="font-medium">Failed to load purchase order.</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            PO id: <span className="font-mono">{poId}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/purchases"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Purchase Orders
          </Link>

          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{purchaseOrder.poNumber}</h1>
            {poStatusBadge(purchaseOrder.status)}
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Supplier: <span className="font-medium text-foreground">{supplierName}</span>{" "}
            • Order date: {formatDate(purchaseOrder.orderDate)} • Due: {formatDate(purchaseOrder.dueDate ?? "Unassigned")}
          </p>

          <p className="mt-1 text-xs text-muted-foreground font-mono">{purchaseOrder.id}</p>
        </div>

        <div className="text-right">
          <div className="text-xs text-muted-foreground">PO Total</div>
          <div className="text-2xl font-semibold">{money(purchaseOrder.total)}</div>
          <div className="text-xs text-muted-foreground">
            Subtotal {money(purchaseOrder.subtotal)} • Tax {money(purchaseOrder.tax)}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <FileTextIcon className="h-4 w-4" />
              Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary?.invoiceCount ?? 0}</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <ReceiptIcon className="h-4 w-4" />
              GRNs
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary?.grnCount ?? 0}</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <FileTextIcon className="h-4 w-4" />
              Invoiced Total
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{money(summary?.invoicedTotal)}</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <PackageIcon className="h-4 w-4" />
              Total Received Qty
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary?.receivedQtyTotal ?? 0}</CardContent>
        </Card>
      </div>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5" />
            Supplier Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!purchaseOrder.invoices?.length ? (
            <div className="text-sm text-muted-foreground">No invoices created yet.</div>
          ) : (
            <div className="space-y-3">
              {purchaseOrder.invoices.map((inv: any) => (
                <div key={inv.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium">{inv.invoiceNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        Date: {formatDate(inv.date)} • Due: {formatDate(inv.dueDate)}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Lines: {inv.items?.length ?? 0} • Status:{" "}
                        <span className="font-medium">{inv.status}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">{money(inv.amount)}</div>
                      <div className="text-xs text-muted-foreground">
                        GRN: {inv.goodsReceipt?.grnNumber ?? "—"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* GRNs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ReceiptIcon className="h-5 w-5" />
            Goods Receipts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!purchaseOrder.grns?.length ? (
            <div className="text-sm text-muted-foreground">No GRNs posted/created yet.</div>
          ) : (
            <div className="space-y-3">
              {purchaseOrder.grns.map((grn: any) => (
                <div key={grn.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium">{grn.grnNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        Date: {formatDate(grn.date)} • Status:{" "}
                        <span className="font-medium">{grn.status}</span>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Invoice: {grn.invoice?.invoiceNumber ?? "—"} • Lines:{" "}
                        {grn.lines?.length ?? 0}
                      </div>
                    </div>

                    <div className="text-right text-xs text-muted-foreground">
                      {grn.status === "POSTED" ? (
                        <span className="inline-flex items-center gap-1 text-green-700">
                          <CheckCircle2Icon className="h-4 w-4" /> Posted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-orange-700">
                          <ClockIcon className="h-4 w-4" /> Draft
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fulfillment table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageIcon className="h-5 w-5" />
            Line Items Fulfillment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Ordered</TableHead>
                  <TableHead className="text-center">Received</TableHead>
                  <TableHead className="text-center">Pending</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fulfillmentRows.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.unit}</div>
                    </TableCell>
                    <TableCell className="text-center">{r.ordered}</TableCell>
                    <TableCell className="text-center text-green-700 font-medium">{r.received}</TableCell>
                    <TableCell className="text-center text-orange-700 font-medium">{r.pending}</TableCell>
                    <TableCell className="text-center">
                      {r.pending === 0 ? (
                        <CheckCircle2Icon className="h-5 w-5 text-green-700 inline" />
                      ) : r.received > 0 ? (
                        <Clock1Icon className="h-5 w-5 text-orange-700 inline" />
                      ) : (
                        <AlertCircleIcon className="h-5 w-5 text-muted-foreground inline" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!fulfillmentRows.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-sm text-muted-foreground">
                      No items found on this PO.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

