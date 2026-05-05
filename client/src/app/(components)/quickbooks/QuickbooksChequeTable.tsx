"use client";

import { useGetQuickBooksChequesQuery } from "@/app/state/api";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import QuickbooksPagination from "./Pagination";
import { useState } from "react";
import { CalendarDays, SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const limit = 10;

  const { data, isLoading, isError } = useGetQuickBooksChequesQuery({
    page,
    limit,
    search,
    startDate,
    endDate,
  });

  const cheques = data?.data ?? [];
  const meta = data?.meta;
  const summary = data?.summary;

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Loading cheques...</p>
    );
  }

  if (isError) {
    return <p className="text-sm text-red-500">Failed to load cheques.</p>;
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle>Cheques Paid</CardTitle>
          <CardDescription>
            Cheques Sync from Quickbooks Desktop
          </CardDescription>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative max-w-sm">
            <SearchIcon className="absolute w-4 h-4 text-muted-foreground top-2.5 left-3" />
            <Input
              placeholder="Search by Payee, Cheque # or Account Name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Start date
              </label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                End date
              </label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>

            {(startDate || endDate) && (
              <Button
                variant="outline"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setPage(1);
                }}
              >
                Clear dates
              </Button>
            )}
          </div>
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
                    <Badge variant="outline">
                      {cheque.status ?? "UNKNOWN"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {money(cheque.amount)}
                  </TableCell>
                </TableRow>
              ))}

              {cheques.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    No cheques found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>

            {summary && cheques.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={5} className="font-semibold">
                    Filtered Total
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {money(summary.totalChequePayment)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>

        {summary && (
          <div className="mt-8 rounded-xl border bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">
              Total Cheque Payments
            </p>
            <p className="mt-2 text-2xl font-bold">
              {money(summary.totalChequePayment)}
            </p>
          </div>
        )}

        {meta && (
          <div className="mt-6">
            <QuickbooksPagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              onPageChange={setPage}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}