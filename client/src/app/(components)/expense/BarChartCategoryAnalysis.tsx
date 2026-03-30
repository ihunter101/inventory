"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { Expense } from "@/app/state/api";
import { getCategoryColor } from "@/utils/categoryColors";

type Props = {
  expenses: Expense[];
};

const formatCurrency = (value: number) =>
  `$${value.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

const BarChartCategoryAnalysis = ({ expenses }: Props) => {
  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {};

    expenses.forEach((e) => {
      const category = e.category ?? "Other";
      totals[category] = (totals[category] ?? 0) + e.amount;
    });

    return Object.entries(totals).map(([name, value]) => ({
      name,
      value,
      fill: getCategoryColor(name),
    }));
  }, [expenses]);

  return (
    <div className="mb-8 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <h3 className="mb-6 text-lg font-semibold text-foreground">
        Category Analysis
      </h3>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={categoryData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.35}
          />

          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
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
            formatter={(value: any) => [formatCurrency(value), "Amount"]}
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              color: "hsl(var(--popover-foreground))",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.18)",
            }}
            cursor={{ fill: "hsl(var(--muted) / 0.35)" }}
          />

          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {categoryData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartCategoryAnalysis;