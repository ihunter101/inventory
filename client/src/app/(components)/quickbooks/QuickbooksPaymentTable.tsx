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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import QuickbooksPagination from "./Pagination";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

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
    const [search, setSearch] = useState("");
const limit = 10;

const { data, isLoading, isError } = useGetQuickBooksPaymentsQuery({
  page,
  limit,
  search,
});

const payments = data?.data ?? [];
const meta = data?.meta;


  if (isLoading) return <p className="text-sm text-muted-foreground">Loading payments...</p>;
  if (isError) return <p className="text-sm text-red-500">Failed to load payments.</p>;

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-3">
        <div>
          <CardTitle>Payments Received</CardTitle>
        <CardDescription>Payments Synced from Quickbooks Desktop</CardDescription>
        </div>
        
        <div className="relative max-w-sm">
          <SearchIcon className="h-4 w-4 absolute text-muted-foreground left-3 top-2.5"/>
          <Input 
            placeholder="Search by Inv#, Customer Name or Customer Id..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1)
            }}
            className="pl-9"
          />
        </div>
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