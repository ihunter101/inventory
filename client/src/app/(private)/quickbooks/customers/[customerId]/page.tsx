"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useGetQuickBooksCustomerByIdQuery } from "@/app/state/api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function money(value: unknown) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function date(value?: string | null) {
  if (!value) return "—";

  const d = new Date(value);

  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export default function QuickBooksCustomerDetailPage() {
  const params = useParams();
  const customerId = String(params.customerId);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const limit = 25;

  const { data, isLoading, isFetching, isError } =
    useGetQuickBooksCustomerByIdQuery({
      customerId,
      page,
      limit,
      search,
    });

  if (isLoading) {
    return <main className="p-6">Loading customer...</main>;
  }

  if (isError || !data?.customer) {
    return <main className="p-6 text-red-500">Failed to load customer.</main>;
  }

  const customer = data.customer;
  const summary = data.summary;
  const invoices = data?.invoices ?? [];
  const meta = data.meta;

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {customer.name}
        </h1>

        <p className="text-sm text-muted-foreground">
          QuickBooks customer profile and related invoices.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Invoiced</CardDescription>
            <CardTitle>{money(summary.totalInvoiced)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Total Paid</CardDescription>
            <CardTitle>{money(summary.totalPaidFromPayments)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Open Balance</CardDescription>
            <CardTitle>{money(summary.totalBalance)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Unpaid Invoices</CardDescription>
            <CardTitle>{summary.unpaidInvoiceCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Company</p>
            <p className="font-medium">{customer.companyName ?? "—"}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{customer.email ?? "—"}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Sub-client</p>
            <p className="font-medium">{customer.subClientName ?? "—"}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Created in QuickBooks
            </p>
            <p className="font-medium">{date(customer.qbTimeCreated)}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className="font-medium">{money(customer.balance)}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <p className="font-medium">{money(customer.totalBalance)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            Paginated invoices linked to this QuickBooks customer.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input
              value={search}
              placeholder="Search invoice number..."
              className="max-w-sm"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />

            {isFetching && (
              <p className="text-sm text-muted-foreground">Refreshing...</p>
            )}
          </div>

          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
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
                    <TableCell>{invoice.invoiceNumber ?? "—"}</TableCell>
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
                      <Badge variant="outline">{invoice.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}

                {invoices.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No invoices found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {meta.page} of {meta.totalPages || 1} · {meta.total} invoices
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={!meta.hasPrevPage || isFetching}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
              >
                Previous
              </Button>

              <Button
                variant="outline"
                disabled={!meta.hasNextPage || isFetching}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}