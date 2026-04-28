"use client";

import { useGetQuickBooksChequesQuery } from "@/app/state/api";
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
import QuickbooksPagination from "./Pagination";
import { useState } from "react";
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

export default function QuickbooksChequeTable() {

     const [page, setPage] = useState(1);
     const [search, setSearch] = useState("");
    const limit = 10;

  const { data, isLoading, isError } = useGetQuickBooksChequesQuery({
  page,
  limit,
  search
});

const cheques = data?.data ?? [];
const meta = data?.meta;

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading cheques...</p>;
  if (isError) return <p className="text-sm text-red-500">Failed to load cheques.</p>;

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-3">
        <div>
          <CardTitle>Cheques Paid</CardTitle>
          <CardDescription>Cheques Sync from Quickbooks Desktop</CardDescription>
        </div>

        <div className="relative max-w-sm">
          <SearchIcon className="absolute w-4 h-4 text-muted-foreground top-2.5 left-3"/>
          <Input
            placeholder="Search by Payee, Cheque # or Account Name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
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
                <TableHead>Payee</TableHead>
                <TableHead>Cheque #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {cheques.map((cheque: any) => (
                <TableRow key={cheque.chequePaymentId}>
                  <TableCell>{cheque.payeeName}</TableCell>
                  <TableCell>{cheque.chequeNumber ?? "-"}</TableCell>
                  <TableCell>{date(cheque.chequeDate)}</TableCell>
                  <TableCell>{cheque.accountName ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{cheque.status ?? "UNKNOWN"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{money(cheque.amount)}</TableCell>
                </TableRow>
              ))}

              {cheques.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No cheques found.
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