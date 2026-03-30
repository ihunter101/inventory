"use client";

import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useListStockRequestsQuery } from "@/app/state/api";
import { Location, StockRequestStatus } from "@/app/state/stockSheetSlice";
import { SkeletonDemo } from "@/app/(components)/shared/skeleton";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Filter, FolderOpen, Search } from "lucide-react";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DEBOUNCE_MS = 400;
const MIN_CHARS = 2;

export default function StockRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const page = Number(searchParams.get("page") ?? 1);
  const status = searchParams.get("status") as StockRequestStatus;
  const location = searchParams.get("location") as Location;
  const search = searchParams.get("search") ?? "";

  const [searchInput, setSearchInput] = useState(search);

  const safeSearch = search.trim().length >= MIN_CHARS ? search.trim() : undefined;

  const { data, isLoading, isError, isFetching, error } = useListStockRequestsQuery({
    page,
    status: status || undefined,
    location: location || undefined,
    search: safeSearch || undefined,
    pageSize: 20,
  });

  useEffect(() => {
    if (!isError) return;

    if (error && typeof error === "object" && "status" in error) {
      console.error("Stock requests query error:", {
        status: (error as any).status,
        data: (error as any).data,
      });
    } else {
      console.error("Stock requests query error:", error);
    }
  }, [isError, error]);

  const updateQueryParams = useCallback(
    (updates: Record<string, string | null | number>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === undefined || v === "") params.delete(k);
        else params.set(k, String(v));
      }

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();

      if (trimmed.length > 0 && trimmed.length < MIN_CHARS) return;

      if (trimmed !== search) {
        updateQueryParams({ search: trimmed || null, page: 1 });
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchInput, search, updateQueryParams]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const getPageNumbers = () => {
    const totalPages = data?.totalPages || 1;
    const currentPage = page;
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      if (currentPage > 3) pages.push("ellipsis-start");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push("ellipsis-end");

      pages.push(totalPages);
    }

    return pages;
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "FULFILLED":
        return "border-emerald-200/60 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/40 dark:text-emerald-400";
      case "SUBMITTED":
        return "border-primary/20 bg-primary/10 text-primary";
      case "CANCELLED":
        return "border-red-200/60 bg-red-500/10 text-red-700 dark:border-red-900/40 dark:text-red-400";
      default:
        return "border-border/60 bg-muted/40 text-foreground";
    }
  };

  if (isLoading) return <SkeletonDemo />;

  if (isError || !data) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <div className="rounded-2xl border border-red-200/60 bg-red-500/10 p-6 dark:border-red-900/40">
          <h2 className="mb-2 text-lg font-semibold text-red-700 dark:text-red-400">
            Failed to load stock requests
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {error && "status" in error
              ? `Error ${error.status}: ${JSON.stringify(error.data)}`
              : "An unexpected error occurred"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const pageNumbers = getPageNumbers();
  const hasActiveFilters = status || location || search;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <Card className="mb-6 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl tracking-tight text-foreground">
                Stock Requests
              </CardTitle>
              <CardDescription className="mt-1 text-muted-foreground">
                Manage and track all stock requests across locations
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {data.totalItems} Total
              </Badge>
              {hasActiveFilters && (
                <Badge variant="secondary" className="text-sm">
                  <Filter className="mr-1 h-3 w-3" />
                  Filtered
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="flex-1">
              <InputGroup>
                <InputGroupAddon>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Search by name, email, or ID..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="h-10"
                />
                {isFetching && (
                  <InputGroupAddon align="inline-end">
                    <InputGroupText className="text-xs text-muted-foreground">
                      Searching...
                    </InputGroupText>
                  </InputGroupAddon>
                )}
              </InputGroup>
            </div>

            <select
              value={status || "all"}
              onChange={(e) =>
                updateQueryParams({
                  status: e.target.value === "all" ? null : e.target.value,
                  page: 1,
                })
              }
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isFetching}
            >
              <option value="all">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={location || "all"}
              onChange={(e) =>
                updateQueryParams({
                  location: e.target.value === "all" ? null : e.target.value,
                  page: 1,
                })
              }
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isFetching}
            >
              <option value="all">All Locations</option>
              <option value="Tapion">Tapion</option>
              <option value="blueCoral">Blue Coral</option>
              <option value="manoelStreet">Manoel Street</option>
              <option value="sunnyAcres">Sunny Acres</option>
              <option value="emCare">EM Care</option>
              <option value="rodneyBay">Rodney Bay</option>
              <option value="memberCare">Member Care</option>
              <option value="vieuxFort">Vieux Fort</option>
              <option value="soufriere">Soufriere</option>
              <option value="other">Other</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        {isFetching && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        )}

        <Table className="w-full text-sm">
          <TableHeader>
            <TableRow className="border-border/60 bg-muted/30">
              <TableHead className="p-3 text-muted-foreground">Submitted</TableHead>
              <TableHead className="p-3 text-muted-foreground">Requester</TableHead>
              <TableHead className="p-3 text-muted-foreground">Location</TableHead>
              <TableHead className="p-3 text-muted-foreground">Lines</TableHead>
              <TableHead className="p-3 text-muted-foreground">Status</TableHead>
              <TableHead className="p-3" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-8 text-center text-muted-foreground">
                  No stock requests found
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((r) => (
                <TableRow
                  key={r.id}
                  className="border-t border-border/60 transition-colors hover:bg-muted/30"
                >
                  <TableCell className="p-3 text-foreground">
                    {new Date(r.submittedAt).toLocaleString()}
                  </TableCell>

                  <TableCell className="p-3">
                    <div className="font-medium text-foreground">{r.requestedByName}</div>
                    <div className="text-sm text-muted-foreground">{r.requestedByEmail}</div>
                  </TableCell>

                  <TableCell className="p-3 text-foreground">
                    {r.requestedByLocation}
                  </TableCell>

                  <TableCell className="p-3 text-foreground">
                    {r.lineCount || 0}
                  </TableCell>

                  <TableCell className="p-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                        r.status
                      )}`}
                    >
                      {r.status}
                    </span>
                  </TableCell>

                  <TableCell className="p-3 text-right">
                    <Link
                      href={`/stock-requests/${r.id}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted/40 hover:text-primary"
                    >
                      <FolderOpen className="h-4 w-4" />
                      Open
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data.totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => page > 1 && updateQueryParams({ page: page - 1 })}
                  className={`cursor-pointer ${
                    page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-muted/40 hover:text-primary"
                  }`}
                />
              </PaginationItem>

              {pageNumbers.map((pageNum, idx) => (
                <PaginationItem key={idx}>
                  {typeof pageNum === "number" ? (
                    <PaginationLink
                      onClick={() => updateQueryParams({ page: pageNum })}
                      isActive={page === pageNum}
                      className={`cursor-pointer ${
                        page === pageNum
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "hover:bg-muted/40 hover:text-primary"
                      }`}
                    >
                      {pageNum}
                    </PaginationLink>
                  ) : (
                    <PaginationEllipsis />
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    page < data.totalPages && updateQueryParams({ page: page + 1 })
                  }
                  className={`cursor-pointer ${
                    page >= data.totalPages
                      ? "pointer-events-none opacity-50"
                      : "hover:bg-muted/40 hover:text-primary"
                  }`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Showing page {data.page} of {data.totalPages} ({data.totalItems} total items)
          </div>
        </div>
      )}
    </div>
  );
}
