"use client";

import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { Expense } from "@/app/state/api";

type Props = {
  expenses: Expense[];
};

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#84CC16",
  "#F97316",
];

const formatCurrency = (value: number) =>
  `$${value.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

const PieChartExpenses = ({ expenses }: Props) => {
  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {};

    expenses.forEach((e) => {
      const category = e.category ?? "Other";
      totals[category] = (totals[category] ?? 0) + e.amount;
    });

    return Object.entries(totals).map(([name, value], index) => ({
      name,
      value,
      fill: COLORS[index % COLORS.length],
    }));
  }, [expenses]);

  return (
    <div className="bg-white rounded-lg shadow border border-slate-200 p-6 mb-8">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">
        Category Distribution
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={categoryData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {categoryData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <RechartsTooltip
            formatter={(value) => [formatCurrency(value as number), "Amount"]}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 space-y-2">
        {categoryData.slice(0, 4).map((item, index) => (
          <div
            key={item.name}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: item.fill }}
              ></div>
              <span className="text-slate-600">{item.name}</span>
            </div>
            <span className="font-medium text-slate-900">
              {formatCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PieChartExpenses;
