"use client";

import React, { useMemo } from "react";
import { useGetDashboardMetricsQuery } from "@/app/state/api";
import { TrendingDown, TrendingUp, DollarSign, Calendar, PieChart as PieChartIcon } from "lucide-react";
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

    // Category totals with transaction count
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

    // Build category data with percentages
    const categoryData: CategoryData[] = Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        value: data.total,
        count: data.count,
        percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 categories

    const highestCategory = categoryData[0] ?? null;

    // Calculate avg per day
    const dayTotals = new Map<string, number>();
    for (const e of expenses) {
      const d = new Date(e.date);
      if (Number.isNaN(d.getTime())) continue;
      const key = dayKeyUTC(d);
      dayTotals.set(key, (dayTotals.get(key) ?? 0) + safeNumber(e.amount));
    }
    const daysCount = Math.max(dayTotals.size, 1);
    const avgPerDay = totalExpenses / daysCount;

    // Calculate change percentage
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
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-1">{data.name}</p>
          <p className="text-sm text-gray-600">
            Amount: <span className="font-bold text-blue-600">${data.value.toFixed(2)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Transactions: <span className="font-semibold">{data.count}</span>
          </p>
          <p className="text-sm text-gray-600">
            Share: <span className="font-semibold">{data.percentage.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="row-span-3 bg-white shadow-md rounded-2xl flex items-center justify-center">
        <div className="text-gray-500">Loading expenses...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="row-span-3 bg-white shadow-md rounded-2xl flex items-center justify-center">
        <div className="text-red-500 text-center p-5">
          <p className="font-semibold">Error loading expenses</p>
          <p className="text-sm mt-2">{JSON.stringify(error)}</p>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="row-span-3 bg-white shadow-md rounded-2xl flex flex-col">
        <div className="px-7 pt-5 pb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-gray-400" />
            Expense Summary
          </h2>
        </div>
        <hr />
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No expense data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
     <div className="h-full bg-white shadow-sm rounded-2xl border border-slate-200 flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="px-7 pt-5 pb-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-gray-600" />
            Expense Summary
          </h2>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              ${totalExpenses.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">{totalTransactions} transactions</p>
          </div>
        </div>
      </div>
      <hr />

      {/* KEY METRICS */}
      <div className="px-7 py-4 bg-gray-50">
        <div className="grid grid-cols-3 gap-4">
          {/* Avg per day */}
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
              <Calendar className="w-3 h-3" />
              Avg / Day
            </div>
            <p className="text-lg font-bold text-gray-900">
              ${avgPerDay.toFixed(2)}
            </p>
          </div>

          {/* Trend */}
          <div>
            <div className="text-xs text-gray-600 mb-1">Trend</div>
            {changePercent !== null ? (
              <div className="flex items-center gap-1">
                {changePercent >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-green-500" />
                )}
                <span
                  className={`text-lg font-bold ${
                    changePercent >= 0 ? "text-red-500" : "text-green-500"
                  }`}
                >
                  {changePercent >= 0 ? "+" : ""}
                  {changePercent.toFixed(1)}%
                </span>
              </div>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>

          {/* Top Category */}
          <div>
            <div className="text-xs text-gray-600 mb-1">Top Category</div>
            {highestCategory ? (
              <div>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {highestCategory.name}
                </p>
                <p className="text-xs text-gray-600">
                  {highestCategory.percentage.toFixed(0)}%
                </p>
              </div>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>
        </div>
      </div>

      {/* CHART */}
      <div className="flex-1 px-7 py-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colorArray[index % colorArray.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* CATEGORY LEGEND */}
      <div className="px-7 pb-5">
        <div className="flex flex-wrap gap-2">
          {categoryData.map((entry, index) => (
            <div
              key={`legend-${index}`}
              className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded text-xs"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: colorArray[index % colorArray.length] }}
              />
              <span className="font-medium text-gray-700">{entry.name}</span>
              <span className="text-gray-500">
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