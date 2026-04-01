"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Expense } from "@/app/state/api";

type Props = {
  expenses: Expense[];
};

const formatCurrency = (amount: number) =>
  `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ExpenseTrendChart = ({ expenses }: Props) => {
  const monthlyData = useMemo(() => {
    const totals: Record<string, number> = {};

    expenses.forEach((expense) => {
      const date = new Date(expense.createdAt);

      if (isNaN(date.getTime())) return;

      const monthKey = `${date.toLocaleString("default", {
        month: "short",
      })} ${date.getFullYear()}`;

      totals[monthKey] = (totals[monthKey] ?? 0) + Number(expense.amount || 0);
    });

    return Object.entries(totals)
      .map(([month, amount]) => ({
        month,
        amount,
        sortDate: new Date(`1 ${month}`).getTime(),
      }))
      .sort((a, b) => a.sortDate - b.sortDate)
      .map(({ month, amount }) => ({ month, amount }));
  }, [expenses]);

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm lg:col-span-2">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-foreground">Expense Trend</h3>
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
            tickFormatter={(value) => `$${(Number(value) / 1000).toFixed(0)}K`}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            stroke="hsl(var(--muted-foreground))"
            tickLine={false}
            axisLine={false}
          />

          <Tooltip
            formatter={(value: number | undefined) => [
              formatCurrency(value ?? 0),
              "Amount",
            ]}
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