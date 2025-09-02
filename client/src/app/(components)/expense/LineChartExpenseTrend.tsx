"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useMemo, useState } from "react";
import { Expense } from "@/app/state/api";

type Props = {
  expenses: Expense[];
};

const formatCurrency = (amount: number) =>
  `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const ExpenseTrendChart = ({ expenses }: Props) => {
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  const monthlyData = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;

    if (selectedPeriod === "3m") {
      startDate = new Date();
      startDate.setMonth(now.getMonth() - 3);
    } else if (selectedPeriod === "6m") {
      startDate = new Date();
      startDate.setMonth(now.getMonth() - 6);
    }

    const filtered = startDate
      ? expenses.filter((e) => new Date(e.date) >= startDate)
      : expenses;

    const totals: Record<string, number> = {};

    filtered.forEach((expense) => {
      const date = new Date(expense.date);
      const monthKey = `${date.toLocaleString("default", {
        month: "short",
      })} ${date.getFullYear()}`;

      totals[monthKey] = (totals[monthKey] ?? 0) + expense.amount;
    });

    const result = Object.entries(totals)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => new Date(`1 ${a.month}`).getTime() - new Date(`1 ${b.month}`).getTime());

    return result;
  }, [expenses, selectedPeriod]);

  return (
    <div className="lg:col-span-2 bg-white rounded-lg shadow border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Expense Trend</h3>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="text-sm border border-slate-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Time</option>
          <option value="6m">Last 6 Months</option>
          <option value="3m">Last 3 Months</option>
        </select>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={monthlyData}>
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#64748B" />
          <YAxis
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            tick={{ fontSize: 12 }}
            stroke="#64748B"
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), "Amount"]}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#3B82F6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorAmount)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExpenseTrendChart;