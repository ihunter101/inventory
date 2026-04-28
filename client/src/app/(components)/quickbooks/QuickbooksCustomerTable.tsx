"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { useGetQuickBooksCustomersQuery } from "@/app/state/api";

function date(value?: string | null) {
  if (!value) return "—";

  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

function money(value: unknown) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

export default function QuickbooksCustomerTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useGetQuickBooksCustomersQuery({
    page,
    limit: 10,
    search,
  });

  const customers = data?.data ?? [];
  const meta = data?.meta;

  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;
  const currentPage = meta?.page ?? page;

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div>
          <CardTitle>QuickBooks Customers</CardTitle>
          <CardDescription>
            Customers synced from QuickBooks Desktop.
          </CardDescription>
        </div>

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
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading customers...</p>
        ) : isError ? (
          <p className="text-sm text-red-500">Failed to load customers.</p>
        ) : customers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No customers found.</p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Created in QB</TableHead>
                  <TableHead>Sub-client</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {customers.map((customer: any) => (
                  <TableRow key={customer.customerId}>
                    <TableCell className="font-medium">
                      {customer.name ?? "—"}
                    </TableCell>

                    <TableCell>{customer.companyName ?? "—"}</TableCell>

                    <TableCell>{customer.email ?? "—"}</TableCell>

                    <TableCell>{date(customer.qbTimeCreated)}</TableCell>

                    <TableCell>{customer.subClientName ?? "—"}</TableCell>

                    <TableCell className="text-right">
                      {money(customer.balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} · {total} records
          </p>

          <div className="flex gap-2">
            <button
              disabled={!meta?.hasPrevPage}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
            >
              Previous
            </button>

            <button
              disabled={!meta?.hasNextPage}
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}