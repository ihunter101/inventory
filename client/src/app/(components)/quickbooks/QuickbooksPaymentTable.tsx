"use client";

import { useGetQuickBooksPaymentsQuery } from "@/app/state/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import QuickbooksPagination from "./Pagination";

function money(value: unknown) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function date(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
}

export default function QuickbooksPaymentTable() {

    const [page, setPage] = useState(1);
const limit = 10;

const { data, isLoading, isError } = useGetQuickBooksPaymentsQuery({
  page,
  limit,
});

const payments = data?.data ?? [];
const meta = data?.meta;


  if (isLoading) return <p className="text-sm text-muted-foreground">Loading payments...</p>;
  if (isError) return <p className="text-sm text-red-500">Failed to load payments.</p>;

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Payments Received</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {payments.map((payment: any) => (
                <TableRow key={payment.paymentId}>
                  <TableCell>{payment.customerName}</TableCell>
                  <TableCell>{date(payment.paymentDate)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{payment.method ?? "UNKNOWN"}</Badge>
                  </TableCell>
                  <TableCell>{payment.referenceNumber ?? "-"}</TableCell>
                  <TableCell className="text-right">{money(payment.amount)}</TableCell>
                </TableRow>
              ))}

              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No payments found.
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