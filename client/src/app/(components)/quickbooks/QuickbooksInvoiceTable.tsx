"use client";

import Link from "next/link";
import { useState } from "react";
import { MoreHorizontal, SearchIcon, Eye, ListOrdered } from "lucide-react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import QuickbooksPagination from "./Pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [search, setSearch] = useState("");
  const limit = 10;

  const { data, isLoading, isError } = useGetQuickBooksInvoicesQuery({
    page,
    limit,
    search,
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
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle>QuickBooks Invoices</CardTitle>
          <CardDescription>
            Customer Sync from QuickBooks Desktop
          </CardDescription>
        </div>

        <div className="relative w-full max-w-md">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Inv #, Company Name, or Client Name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-xl border overflow-x-auto">
          <Table className="min-w-[1050px] table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[110px]">Invoice #</TableHead>
                <TableHead className="w-[290px]">Customer</TableHead>
                <TableHead className="w-[130px]">Date</TableHead>
                <TableHead className="w-[130px]">Due</TableHead>
                <TableHead className="w-[130px] text-right">Total</TableHead>
                <TableHead className="w-[120px] text-right">Paid</TableHead>
                <TableHead className="w-[130px] text-right">Balance</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[90px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {invoices.map((invoice: any) => (
                <TableRow key={invoice.invoiceId}>
                  <TableCell className="font-medium">
                    {invoice.invoiceNumber ?? "-"}
                  </TableCell>

                  <TableCell className="truncate font-medium">
                    {invoice.customerName ?? "-"}
                  </TableCell>

                  <TableCell>{date(invoice.invoiceDate)}</TableCell>

                  <TableCell>{date(invoice.dueDate)}</TableCell>

                  <TableCell className="text-right">
                    {money(invoice.totalAmount)}
                  </TableCell>

                  <TableCell className="text-right">
                    {money(invoice.amountPaid)}
                  </TableCell>

                  <TableCell className="text-right font-medium">
                    {money(invoice.balanceRemaining)}
                  </TableCell>

                  <TableCell>
                    <Badge variant={statusVariant(invoice.status) as any}>
                      {invoice.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Invoice Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem asChild>
                          <Link href={`/quickbooks/invoices/${invoice.invoiceId}`}>
                            <ListOrdered className="mr-2 h-4 w-4" />
                            View line items
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link href={`/quickbooks/invoices/${invoice.invoiceId}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View details
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}

              {invoices.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
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