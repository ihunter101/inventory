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
  LineChart,
  Line,
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

  // Calculate date range
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();

    switch (dateRange) {
      case "7d":
        start.setDate(start.getDate() - 7);
        break;
      case "30d":
        start.setDate(start.getDate() - 30);
        break;
      case "90d":
        start.setDate(start.getDate() - 90);
        break;
      case "1y":
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  };

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
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return formatCurrency(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{date}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-600">{entry.name}:</span>
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
    <div className="h-full bg-white shadow-sm rounded-2xl border border-slate-200 flex items-center justify-center">
      <div className="text-slate-500">Loading financial data...</div>
    </div>
  );
}


  if (isError || !data) {
    return (
      <div className="row-span-4 xl:row-span-3 bg-white shadow-md rounded-2xl flex items-center justify-center">
        <div className="text-red-500 text-center p-5">
          <p className="font-semibold">Error loading financial data</p>
        </div>
      </div>
    );
  }

  if (!revenueProfit) {
  return (
    <div className="row-span-4 xl:row-span-3 bg-white shadow-md rounded-2xl flex items-center justify-center">
      <div className="text-gray-500">No data available for selected period</div>
    </div>
  );
}

const { chartData, summary, topExpenseCategories } = revenueProfit;


  const isProfitable = summary.totalProfit >= 0;

  return (
    <div className="h-full bg-white shadow-sm rounded-2xl border border-slate-200 flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="px-7 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-600" />
            Revenue & Profit
          </h2>

          {/* Date Range Selector */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(["7d", "30d", "90d", "1y"] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  dateRange === range
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
      <hr />

      {/* KEY METRICS */}
      <div className="px-7 py-4 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="grid grid-cols-3 gap-6">
          {/* Revenue */}
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
              <TrendingUpIcon className="w-3 h-3" />
              Total Revenue
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(summary.totalRevenue)}
            </p>
            {summary.revenueTrend !== null && (
              <div className="flex items-center gap-1 mt-1">
                {summary.revenueTrend >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span
                  className={`text-xs font-medium ${
                    summary.revenueTrend >= 0 ? "text-green-600" : "text-red-600"
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
            <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
              <Receipt className="w-3 h-3" />
              Total Expenses
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(summary.totalExpenses)}
            </p>
            <div className="text-xs text-gray-600 mt-1">
              <span className="font-medium">
                {formatCompactCurrency(summary.totalRegularExpenses)}
              </span>{" "}
              +{" "}
              <span className="font-medium">
                {formatCompactCurrency(summary.totalInvoiceExpenses)}
              </span>
            </div>
          </div>

          {/* Profit */}
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
              <Minus className="w-3 h-3" />
              Net Profit
            </div>
            <p
              className={`text-2xl font-bold ${
                isProfitable ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(summary.totalProfit)}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded ${
                  isProfitable
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {summary.profitMargin.toFixed(1)}% margin
              </span>
              {summary.profitTrend !== null && (
                <span
                  className={`text-xs flex items-center gap-0.5 ${
                    summary.profitTrend >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {summary.profitTrend >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
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
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickFormatter={(value) => formatCompactCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
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
          <div className="flex items-center justify-center h-full text-gray-500">
            No data available for selected period
          </div>
        )}
      </div>

      {/* FOOTER - Transaction Summary */}
      <div className="px-7 pb-5">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-gray-600">
              <ShoppingCart className="w-3 h-3" />
              <span>
                {summary.transactionCounts.salesCount} sales •{" "}
                {summary.transactionCounts.expenseCount} expenses •{" "}
                {summary.transactionCounts.invoiceCount} invoices
              </span>
            </div>
            {topExpenseCategories.length > 0 && (
              <div className="text-gray-600">
                Top: <span className="font-semibold">{topExpenseCategories[0].category}</span>{" "}
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