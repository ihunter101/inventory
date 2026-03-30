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

    return Object.entries(totals)
      .map(([month, amount]) => ({ month, amount }))
      .sort(
        (a, b) =>
          new Date(`1 ${a.month}`).getTime() - new Date(`1 ${b.month}`).getTime()
      );
  }, [expenses, selectedPeriod]);

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm lg:col-span-2">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-foreground">Expense Trend</h3>

        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="rounded-md border border-border/60 bg-background px-3 py-1 text-sm text-foreground outline-none ring-0 transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.35}
          />

          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            stroke="hsl(var(--muted-foreground))"
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            stroke="hsl(var(--muted-foreground))"
            tickLine={false}
            axisLine={false}
          />

          <Tooltip
            formatter={(value: number | undefined) => [ formatCurrency(value ?? 0),"Amount", ]}
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              color: "hsl(var(--popover-foreground))",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.18)",
            }}
            cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
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