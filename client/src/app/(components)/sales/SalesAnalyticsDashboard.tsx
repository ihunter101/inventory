"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import SalesPDFDownload from "@/app/pdf/SalesPDFDownload";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useGetSalesAnalysticsQuery } from "@/app/state/api";
import type { SalesAnalytics } from "@/app/state/api"; 

type DateRange = "1m" | "3m" | "6m" | "1y";

const LOCATION_NAMES: Record<number, string> = {
  1: "Tapion",
  2: "Blue Coral",
  3: "Manoel Street",
  4: "Sunny Acres",
  5: "Em Care",
  6: "Rodney Bay",
  7: "Member Care",
  8: "Vieux Fort",
  9: "Soufriere",
  10: "Other",
};

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
  "#84cc16",
];

type ChartPoint = {
  dayKey: string; // YYYY-MM-DD (for sorting)
  label: string;  // display label
  total: number;
  cash: number;
  card: number;
};

export const SalesAnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState<DateRange>("1m");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();

    switch (dateRange) {
      case "1m":
        start.setMonth(start.getMonth() - 1);
        break;
      case "3m":
        start.setMonth(start.getMonth() - 3);
        break;
      case "6m":
        start.setMonth(start.getMonth() - 6);
        break;
      case "1y":
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }, [dateRange]);

  const locationIdParam =
    selectedLocation === "all" ? undefined : Number(selectedLocation);

  const { data, isLoading, error } = useGetSalesAnalysticsQuery({
    startDate,
    endDate,
    ...(locationIdParam ? { locationId: locationIdParam } : {}),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "XCD", // change if you want USD
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // ✅ Chart data: stable grouping + sorting
  const chartData: ChartPoint[] = useMemo(() => {
    if (!data) return [];

    const grouped: Record<string, ChartPoint> = {};

    for (const sale of data.sales) {
      const d = new Date(sale.salesDate);
      const dayKey = d.toISOString().slice(0, 10); // YYYY-MM-DD

      if (!grouped[dayKey]) {
        grouped[dayKey] = {
          dayKey,
          label: d.toLocaleDateString(),
          total: 0,
          cash: 0,
          card: 0,
        };
      }

      grouped[dayKey].total += Number(sale.grandTotal);
      grouped[dayKey].cash += Number(sale.cashTotal);
      grouped[dayKey].card +=
        Number(sale.creditCardTotal) + Number(sale.debitCardTotal);
    }

    return Object.values(grouped).sort((a, b) =>
      a.dayKey.localeCompare(b.dayKey)
    );
  }, [data]);

  // ✅ Location comparison
  const locationData = useMemo(() => {
    if (!data) return [];
    if (!data.analytics?.salesByLocation) return [];

    return data.analytics.salesByLocation
      .map((loc) => ({
        name: LOCATION_NAMES[loc.locationId] ?? `Location ${loc.locationId}`,
        total: loc.totalSales,
        count: loc.count,
        average: loc.count > 0 ? loc.totalSales / loc.count : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <p className="text-red-800 font-semibold">Error loading analytics</p>
        <p className="text-sm text-red-600 mt-2">
          Please check your permissions or try again later
        </p>
      </Card>
    );
  }

  // After loading/error, data should exist but still guard:
  const safeData = data as SalesAnalytics | undefined;

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Sales Analytics</h1>

        <div className="flex gap-3">
          {/* Date Range Filter */}
          <div className="flex gap-2">
            {(["1m", "3m", "6m", "1y"] as DateRange[]).map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? "default" : "outline"}
                onClick={() => setDateRange(range)}
                size="sm"
              >
                {range.toUpperCase()}
              </Button>
            ))}
          </div>

          {/* Location Filter */}
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {Object.entries(LOCATION_NAMES).map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <span className="text-sm font-medium text-gray-600">Total Sales</span>
          <div className="text-3xl font-bold text-blue-600 mt-2">
            {formatCurrency(safeData?.analytics.totalSales ?? 0)}
          </div>
        </Card>

        <Card className="p-6">
          <span className="text-sm font-medium text-gray-600">Cash Sales</span>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {formatCurrency(safeData?.analytics.totalCash ?? 0)}
          </div>
        </Card>

        <Card className="p-6">
          <span className="text-sm font-medium text-gray-600">Card Sales</span>
          <div className="text-3xl font-bold text-purple-600 mt-2">
            {formatCurrency(safeData?.analytics.totalCard ?? 0)}
          </div>
        </Card>
      </div>

      {/* Sales Trend Chart */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Sales Trend</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total Sales" />
            <Line type="monotone" dataKey="cash" stroke="#10b981" strokeWidth={2} name="Cash" />
            <Line type="monotone" dataKey="card" stroke="#8b5cf6" strokeWidth={2} name="Card" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Location Comparison */}
      {selectedLocation === "all" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Sales by Location</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={locationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                <Bar dataKey="total" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Market Share</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={locationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) =>
                    `${name}: ${(Number(percent) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  dataKey="total"
                >
                  {locationData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Detailed Table */}
      <Card className="p-6">
        <div className="flex flex-row justify-between">
          <h2 className="text-xl font-semibold mb-4">Sales Details</h2>
        <SalesPDFDownload
          sales={safeData?.sales ?? []}
          dateRangeLabel={dateRange.toUpperCase()}
          selectedLocationLabel={
            selectedLocation === "all"
              ? "All Locations"
              : LOCATION_NAMES[Number(selectedLocation)] ?? `Location ${selectedLocation}`
          }
          preparedBy="Hunter"
          totals={{
            totalSales: safeData?.analytics.totalSales ?? 0,
            totalCash: safeData?.analytics.totalCash ?? 0,
            totalCard: safeData?.analytics.totalCard ?? 0,
          }}
        />
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Cash</TableHead>
                <TableHead className="text-right">Credit Card</TableHead>
                <TableHead className="text-right">Debit Card</TableHead>
                <TableHead className="text-right">Cheque</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Entered By</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {safeData?.sales?.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{new Date(sale.salesDate).toLocaleDateString()}</TableCell>
                  <TableCell>{LOCATION_NAMES[sale.locationId] ?? `Location ${sale.locationId}`}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(sale.cashTotal))}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(sale.creditCardTotal))}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(sale.debitCardTotal))}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(sale.chequeTotal))}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(Number(sale.grandTotal))}</TableCell>
                  <TableCell className="text-sm text-gray-600">{sale.enteredBy}</TableCell>
                </TableRow>
              ))}

              {safeData?.sales?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                    No sales found for this period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};
