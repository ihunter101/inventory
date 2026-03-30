"use client";

import React, { useMemo } from "react";
import { useGetDashboardMetricsQuery } from "@/app/state/api";
import {
  TrendingDown,
  TrendingUp,
  DollarSign,
  Calendar,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type Expense = {
  expenseId: string;
  category: string;
  amount: number;
  date: string;
  group?: string | null;
  description?: string | null;
  status?: string;
};

type CategoryData = {
  name: string;
  value: number;
  count: number;
  percentage: number;
};

const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  teal: "#14b8a6",
  pink: "#ec4899",
  orange: "#f97316",
};

const colorArray = [
  COLORS.primary,
  COLORS.success,
  COLORS.warning,
  COLORS.purple,
  COLORS.teal,
  COLORS.danger,
];

function safeNumber(n: unknown) {
  const x = typeof n === "number" ? n : Number(n);
  return Number.isFinite(x) ? x : 0;
}

function dayKeyUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

const CardExpenseSummary = () => {
  const { data, isLoading, isError, error } = useGetDashboardMetricsQuery();

  const expenses: Expense[] = (data?.expenseSummary ?? []) as any;

  const {
    categoryData,
    totalExpenses,
    avgPerDay,
    changePercent,
    hasData,
    highestCategory,
    totalTransactions,
  } = useMemo(() => {
    const hasData = expenses.length > 0;

    const categoryMap = new Map<string, { total: number; count: number }>();

    for (const e of expenses) {
      const cat = (e.category || "Uncategorized").trim();
      const amt = safeNumber(e.amount);
      const existing = categoryMap.get(cat) ?? { total: 0, count: 0 };
      categoryMap.set(cat, {
        total: existing.total + amt,
        count: existing.count + 1,
      });
    }

    const totalExpenses = Array.from(categoryMap.values()).reduce(
      (acc, x) => acc + x.total,
      0
    );

    const totalTransactions = expenses.length;

    const categoryData: CategoryData[] = Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        value: data.total,
        count: data.count,
        percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const highestCategory = categoryData[0] ?? null;

    const dayTotals = new Map<string, number>();
    for (const e of expenses) {
      const d = new Date(e.date);
      if (Number.isNaN(d.getTime())) continue;
      const key = dayKeyUTC(d);
      dayTotals.set(key, (dayTotals.get(key) ?? 0) + safeNumber(e.amount));
    }
    const daysCount = Math.max(dayTotals.size, 1);
    const avgPerDay = totalExpenses / daysCount;

    const sortedDays = Array.from(dayTotals.entries()).sort(
      (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()
    );

    let changePercent: number | null = null;
    if (sortedDays.length >= 4) {
      const mid = Math.floor(sortedDays.length / 2);
      const first = sortedDays.slice(0, mid).reduce((acc, [, v]) => acc + v, 0);
      const last = sortedDays.slice(mid).reduce((acc, [, v]) => acc + v, 0);
      changePercent = first === 0 ? null : ((last - first) / first) * 100;
    }

    return {
      categoryData,
      totalExpenses,
      avgPerDay,
      changePercent,
      hasData,
      highestCategory,
      totalTransactions,
    };
  }, [expenses]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as CategoryData;
      return (
        <div className="rounded-xl border border-border/60 bg-popover/95 p-3 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-popover/90">
          <p className="mb-1 font-semibold text-popover-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Amount: <span className="font-bold text-primary">${data.value.toFixed(2)}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Transactions: <span className="font-semibold text-foreground">{data.count}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Share: <span className="font-semibold text-foreground">{data.percentage.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="text-sm text-muted-foreground">Loading expenses...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="p-5 text-center">
          <p className="font-semibold text-destructive">Error loading expenses</p>
          <p className="mt-2 text-sm text-muted-foreground">{JSON.stringify(error)}</p>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="px-7 pb-3 pt-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            <PieChartIcon className="h-5 w-5 text-muted-foreground" />
            Expense Summary
          </h2>
        </div>

        <div className="border-t border-border/60" />

        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <DollarSign className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No expense data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="px-7 pb-3 pt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            <PieChartIcon className="h-5 w-5 text-primary" />
            Expense Summary
          </h2>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">
              ${totalExpenses.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">{totalTransactions} transactions</p>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60" />

      <div className="bg-muted/30 px-7 py-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Avg / Day
            </div>
            <p className="text-lg font-bold text-foreground">${avgPerDay.toFixed(2)}</p>
          </div>

          <div>
            <div className="mb-1 text-xs text-muted-foreground">Trend</div>
            {changePercent !== null ? (
              <div className="flex items-center gap-1">
                {changePercent >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-emerald-500" />
                )}
                <span
                  className={`text-lg font-bold ${
                    changePercent >= 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {changePercent >= 0 ? "+" : ""}
                  {changePercent.toFixed(1)}%
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>

          <div>
            <div className="mb-1 text-xs text-muted-foreground">Top Category</div>
            {highestCategory ? (
              <div>
                <p className="truncate text-sm font-semibold text-foreground">
                  {highestCategory.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {highestCategory.percentage.toFixed(0)}%
                </p>
              </div>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-7 py-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.35}
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              angle={-45}
              textAnchor="end"
              height={60}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.45)" }} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colorArray[index % colorArray.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="px-7 pb-5">
        <div className="flex flex-wrap gap-2">
          {categoryData.map((entry, index) => (
            <div
              key={`legend-${index}`}
              className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-muted/40 px-2.5 py-1.5 text-xs"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: colorArray[index % colorArray.length] }}
              />
              <span className="font-medium text-foreground">{entry.name}</span>
              <span className="text-muted-foreground">
                ${entry.value.toFixed(0)} ({entry.count})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CardExpenseSummary;