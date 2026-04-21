"use client";

import { useState } from "react";
import { useGetQuickBooksInvoicesQuery } from "@/app/state/api";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QuickbooksPagination from "./Pagination";

function money(value: unknown) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function date(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
}

function statusVariant(status?: string) {
  if (status === "PAID") return "default";
  if (status === "PARTIALLY_PAID") return "secondary";
  if (status === "OVERDUE") return "destructive";
  return "outline";
}

export default function QuickbooksInvoiceTable() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError } = useGetQuickBooksInvoicesQuery({
    page,
    limit,
  });

  const invoices = data?.data ?? [];
  const meta = data?.meta;

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading invoices...</p>;
  }

  if (isError) {
    return <p className="text-sm text-red-500">Failed to load invoices.</p>;
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>QuickBooks Invoices</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {invoices.map((invoice: any) => (
                <TableRow key={invoice.invoiceId}>
                  <TableCell>{invoice.invoiceNumber ?? "-"}</TableCell>
                  <TableCell>{invoice.customerName}</TableCell>
                  <TableCell>{date(invoice.invoiceDate)}</TableCell>
                  <TableCell>{date(invoice.dueDate)}</TableCell>
                  <TableCell className="text-right">
                    {money(invoice.totalAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {money(invoice.amountPaid)}
                  </TableCell>
                  <TableCell className="text-right">
                    {money(invoice.balanceRemaining)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(invoice.status) as any}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}

              {invoices.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-8"
                  >
                    No invoices found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {meta && (
          <QuickbooksPagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            onPageChange={setPage}
          />
        )}
      </CardContent>
    </Card>
  );
}