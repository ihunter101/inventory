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
      fill: getCategoryColor(name), // 👈 use helper
    }));
  }, [expenses]);

  return (
    <div className="bg-white rounded-lg shadow border border-slate-200 p-6 mb-8">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">
        Category Analysis
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={categoryData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            tick={{ fontSize: 11 }}
            stroke="#64748B"
          />
          <YAxis
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            tick={{ fontSize: 12 }}
            stroke="#64748B"
          />
          <Tooltip
            formatter={(value: any) => [formatCurrency(value), "Amount"]}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            fill="#3B82F6"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartCategoryAnalysis;
