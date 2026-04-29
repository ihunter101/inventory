"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Eye } from "lucide-react";

import { useGetQuickBooksCustomersQuery } from "@/app/state/api";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

type BalanceFilter = "withBalance" | "zeroBalance" | "all";

function date(value?: string | null) {
  if (!value) return "—";

  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

function money(value: unknown) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

const filterLabels: Record<BalanceFilter, string> = {
  withBalance: "With Balance",
  zeroBalance: "Zero Balance",
  all: "All Customers",
};

export default function QuickbooksCustomerTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [balanceFilter, setBalanceFilter] =
    useState<BalanceFilter>("withBalance");

  const limit = 10;

  const { data, isLoading, isError } = useGetQuickBooksCustomersQuery({
    page,
    limit,
    search,
    balanceFilter,
  });

  const customers = data?.data ?? [];
  const meta = data?.meta;
  const summary = data?.summary;

  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;
  const currentPage = meta?.page ?? page;

  function changeFilter(nextFilter: BalanceFilter) {
    setBalanceFilter(nextFilter);
    setPage(1);
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle>QuickBooks Customers</CardTitle>
          <CardDescription>
            Customers synced from QuickBooks Desktop.
          </CardDescription>
        </div>

        {summary && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">Filtered Customers</p>
              <p className="text-2xl font-semibold">
                {summary.filteredCustomerCount ?? 0}
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">Filtered Balance</p>
              <p className="text-2xl font-semibold">
                {money(summary.filteredBalanceTotal)}
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">All Customer Balance</p>
              <p className="text-2xl font-semibold">
                {money(summary.allBalanceTotal)}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(["withBalance", "zeroBalance", "all"] as BalanceFilter[]).map(
              (filter) => (
                <Button
                  key={filter}
                  type="button"
                  size="sm"
                  variant={balanceFilter === filter ? "default" : "outline"}
                  onClick={() => changeFilter(filter)}
                >
                  {filterLabels[filter]}
                </Button>
              )
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading customers...</p>
        ) : isError ? (
          <p className="text-sm text-red-500">Failed to load customers.</p>
        ) : customers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No customers found.</p>
        ) : (
          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Sub-client</TableHead>
                  <TableHead>Created in QB</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Total Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {customers.map((customer: any) => {
                  const balance = Number(customer.balance ?? 0);

                  return (
                    <TableRow key={customer.customerId}>
                      <TableCell className="font-medium">
                        {customer.name ?? "—"}
                      </TableCell>

                      <TableCell>{customer.companyName ?? "—"}</TableCell>

                      <TableCell>{customer.subClientName ?? "—"}</TableCell>

                      <TableCell>{date(customer.qbTimeCreated)}</TableCell>

                      <TableCell className="text-right">
                        {money(customer.balance)}
                      </TableCell>

                      <TableCell className="text-right">
                        {money(customer.totalBalance)}
                      </TableCell>

                      <TableCell>
                        <Badge variant={balance > 0 ? "default" : "outline"}>
                          {balance > 0 ? "Balance Due" : "Clear"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={`/quickbooks/customers/${customer.customerId}`}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} · {total} records
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!meta?.hasPrevPage}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            >
              Previous
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={!meta?.hasNextPage}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}