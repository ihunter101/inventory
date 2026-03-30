"use client";

import React, { useState } from "react";
import { useGetDashboardMetricsQuery } from "@/app/state/api";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  TrendingUpIcon,
  Minus,
  Receipt,
  ShoppingCart,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type DateRange = "7d" | "30d" | "90d" | "1y";

const CardRevenueAndProfit = () => {
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  const { data, isLoading, isError } = useGetDashboardMetricsQuery();
  const revenueProfit = data?.revenueAndProfit?.[dateRange];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCompactCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return formatCurrency(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      return (
        <div className="rounded-xl border border-border/60 bg-popover/95 p-4 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-popover/90">
          <p className="mb-2 font-semibold text-popover-foreground">{date}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{entry.name}:</span>
              </div>
              <span className="font-bold" style={{ color: entry.color }}>
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="text-sm text-muted-foreground">Loading financial data...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="p-5 text-center">
          <p className="font-semibold text-destructive">Error loading financial data</p>
        </div>
      </div>
    );
  }

  if (!revenueProfit) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="text-sm text-muted-foreground">
          No data available for selected period
        </div>
      </div>
    );
  }

  const { chartData, summary, topExpenseCategories } = revenueProfit;
  const isProfitable = summary.totalProfit >= 0;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      {/* HEADER */}
      <div className="px-7 pt-5 pb-3">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            <DollarSign className="h-5 w-5 text-primary" />
            Revenue & Profit
          </h2>

          <div className="flex gap-1 rounded-xl border border-border/60 bg-muted/60 p-1">
            {(["7d", "30d", "90d", "1y"] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  dateRange === range
                    ? "bg-background text-primary shadow-sm border border-border/50"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border/60" />

      {/* KEY METRICS */}
      <div className="bg-muted/30 px-7 py-4">
        <div className="grid grid-cols-3 gap-6">
          {/* Revenue */}
          <div>
            <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUpIcon className="h-3 w-3" />
              Total Revenue
            </div>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(summary.totalRevenue)}
            </p>
            {summary.revenueTrend !== null && (
              <div className="mt-1 flex items-center gap-1">
                {summary.revenueTrend >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span
                  className={`text-xs font-medium ${
                    summary.revenueTrend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {summary.revenueTrend >= 0 ? "+" : ""}
                  {summary.revenueTrend.toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          {/* Expenses */}
          <div>
            <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Receipt className="h-3 w-3" />
              Total Expenses
            </div>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(summary.totalExpenses)}
            </p>
            <div className="mt-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {formatCompactCurrency(summary.totalRegularExpenses)}
              </span>{" "}
              +{" "}
              <span className="font-medium text-foreground">
                {formatCompactCurrency(summary.totalInvoiceExpenses)}
              </span>
            </div>
          </div>

          {/* Profit */}
          <div>
            <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Minus className="h-3 w-3" />
              Net Profit
            </div>
            <p
              className={`text-2xl font-bold ${
                isProfitable
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatCurrency(summary.totalProfit)}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                  isProfitable
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                }`}
              >
                {summary.profitMargin.toFixed(1)}% margin
              </span>
              {summary.profitTrend !== null && (
                <span
                  className={`flex items-center gap-0.5 text-xs ${
                    summary.profitTrend >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {summary.profitTrend >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {summary.profitTrend >= 0 ? "+" : ""}
                  {summary.profitTrend.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CHART */}
      <div className="flex-1 px-7 py-4">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.35} />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />

              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCompactCurrency(value)}
              />

              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{
                  fontSize: "12px",
                  paddingTop: "10px",
                  color: "hsl(var(--foreground))",
                }}
                iconType="line"
              />

              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorRevenue)"
                name="Revenue"
              />
              <Area
                type="monotone"
                dataKey="totalExpenses"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#colorExpenses)"
                name="Expenses"
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorProfit)"
                name="Profit"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No data available for selected period
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="px-7 pb-5">
        <div className="rounded-xl border border-border/60 bg-muted/40 p-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <ShoppingCart className="h-3 w-3" />
              <span>
                {summary.transactionCounts.salesCount} sales •{" "}
                {summary.transactionCounts.expenseCount} expenses •{" "}
                {summary.transactionCounts.invoiceCount} invoices
              </span>
            </div>

            {topExpenseCategories.length > 0 && (
              <div className="text-muted-foreground">
                Top:{" "}
                <span className="font-semibold text-foreground">
                  {topExpenseCategories[0].category}
                </span>{" "}
                ({formatCompactCurrency(topExpenseCategories[0].amount)})
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardRevenueAndProfit;