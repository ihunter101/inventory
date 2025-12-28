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
} from "@/components/ui/input-group"
import { Filter, FolderOpen, Search } from "lucide-react";
import {
    Table,
    TableHeader,
    TableHead,
    TableRow,
    TableCell,
    TableBody
} from "@/components/ui/table"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

    // Local state for search input with debouncing
    const [searchInput, setSearchInput] = useState(search);

    const safeSearch = search.trim().length >= MIN_CHARS ? search.trim() : undefined;
    const { data, isLoading, isError, isFetching, error } = useListStockRequestsQuery({
        page,
        status: status || undefined,
        location: location || undefined,
        search: safeSearch || undefined,
        pageSize: 20,
    });

    // Log errors for debugging
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

    // Debounce search input
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

    // Debounce search input -> URL -> RTK query
    useEffect(() => {
        const timer = setTimeout(() => {
        const trimmed = searchInput.trim();

        // Don’t query for tiny strings
        if (trimmed.length > 0 && trimmed.length < MIN_CHARS) return;

        // Only update URL if it actually changed
        if (trimmed !== search) {
            updateQueryParams({ search: trimmed || null, page: 1 });
        }
        }, DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [searchInput, search, updateQueryParams]);

    // Keep input synced if user navigates back/forward or external changes happen
    useEffect(() => {
        setSearchInput(search);
    }, [search]);


    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const totalPages = data?.totalPages || 1;
        const currentPage = page;
        const pages: (number | string)[] = [];

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);

            if (currentPage > 3) {
                pages.push("ellipsis-start");
            }

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push("ellipsis-end");
            }

            pages.push(totalPages);
        }

        return pages;
    };

    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case 'FULFILLED': return 'default';
            case 'SUBMITTED': return 'secondary';
            case 'CANCELLED': return 'destructive';
            default: return 'outline';
        }
    };

    if (isLoading) return <SkeletonDemo />
    if (isError || !data) {
        return (
            <div className="mx-auto w-full max-w-6xl p-6">
                <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                    <h2 className="mb-2 text-lg font-semibold text-red-800">Failed to load stock requests</h2>
                    <p className="mb-4 text-sm text-red-600">
                        {error && 'status' in error 
                            ? `Error ${error.status}: ${JSON.stringify(error.data)}` 
                            : 'An unexpected error occurred'}
                    </p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
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
        <div className="container mx-auto py-6 px-4 max-w-7xl">
            {/* Header Card */}
            <Card className="mb-6">
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle className="text-2xl">Stock Requests</CardTitle>
                            <CardDescription className="mt-1">
                                Manage and track all stock requests across locations
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-sm">
                                {data.totalItems} Total
                            </Badge>
                            {hasActiveFilters && (
                                <Badge variant="secondary" className="text-sm">
                                    <Filter className="w-3 h-3 mr-1" />
                                    Filtered
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Filters Row */}
                    <div className="flex flex-col lg:flex-row gap-3">
                        {/* Search Input */}
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

                        {/* Status Filter */}
                        <select
                            value={status || "all"} 
                            onChange={(e) => updateQueryParams({ 
                                status: e.target.value === "all" ? null : e.target.value, 
                                page: 1
                            })}
                            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isFetching}
                        >
                            <option value="all">All Statuses</option>
                            <option value="SUBMITTED">Submitted</option>
                            <option value="FULFILLED">Fulfilled</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>

                        {/* Location Filter */}
                        <select
                            value={location || "all"}
                            onChange={(e) => updateQueryParams({ 
                                location: e.target.value === "all" ? null : e.target.value, 
                                page: 1 
                            })}
                            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isFetching}
                        >
                            <option value="all">All Locations</option>
                            <option value="Tapion">Tapion</option>
                            <option value="blueCoral">Blue Coral</option>
                            <option value="manoelStreet">Manoel Street</option>
                            <option value="sunnyAcres">Sunny Acres</option>
                            <option value="emCare">EM Care</option>
                            <option value="RodneyBay">Rodney Bay</option>
                            <option value="memberCare">Member Care</option>
                            <option value="vieuxFort">Vieux Fort</option>
                            <option value="soufriere">Soufriere</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <div className="relative overflow-hidden rounded-lg border bg-white">
                {isFetching && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50">
                        <div className="text-sm text-gray-500">Loading...</div>
                    </div>
                )}
                
                <Table className="w-full text-sm">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="p-3">Submitted</TableHead>
                            <TableHead className="p-3">Requester</TableHead>
                            <TableHead className="p-3">Location</TableHead>
                            <TableHead className="p-3">Lines</TableHead>
                            <TableHead className="p-3">Status</TableHead>
                            <TableHead className="p-3"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="p-8 text-center text-gray-500">
                                    No stock requests found
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.items.map((r) => (
                                <TableRow key={r.id} className="border-t hover:bg-green-50">
                                    <TableCell className="p-3 text-green-600">
                                        {new Date(r.submittedAt).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="p-3">
                                        <div className="font-medium">{r.requestedByName}</div>
                                        <div className="text-sm text-gray-500">{r.requestedByEmail}</div>
                                    </TableCell>
                                    <TableCell className="p-3">{r.requestedByLocation}</TableCell>
                                    <TableCell className="p-3">{r.lineCount || 0}</TableCell>
                                    <TableCell className="p-3">
                                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                            r.status === 'FULFILLED' ? 'bg-green-100 text-green-700' :
                                            r.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                                            r.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {r.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="p-3 text-right">
                                        <Link 
                                            href={`/stock-requests/${r.id}`}
                                            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-green-50 hover:border-green-500 hover:text-green-700 transition-colors"
                                        >
                                            <FolderOpen className="w-4 h-4" />
                                            Open
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
                <div className="mt-6">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious 
                                    onClick={() => page > 1 && updateQueryParams({ page: page - 1 })}
                                    className={`cursor-pointer hover:bg-green-50 hover:text-green-700 ${
                                        page <= 1 ? 'pointer-events-none opacity-50' : ''
                                    }`}
                                />
                            </PaginationItem>

                            {pageNumbers.map((pageNum, idx) => (
                                <PaginationItem key={idx}>
                                    {typeof pageNum === 'number' ? (
                                        <PaginationLink
                                            onClick={() => updateQueryParams({ page: pageNum })}
                                            isActive={page === pageNum}
                                            className={`cursor-pointer ${
                                                page === pageNum 
                                                    ? 'bg-green-600 text-white hover:bg-green-700' 
                                                    : 'hover:bg-green-50 hover:text-green-700'
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
                                    onClick={() => page < data.totalPages && updateQueryParams({ page: page + 1 })}
                                    className={`cursor-pointer hover:bg-green-50 hover:text-green-700 ${
                                        page >= data.totalPages ? 'pointer-events-none opacity-50' : ''
                                    }`}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>

                    <div className="mt-4 text-center text-sm text-gray-600">
                        Showing page {data.page} of {data.totalPages} ({data.totalItems} total items)
                    </div>
                </div>
            )}
        </div>
    );
}