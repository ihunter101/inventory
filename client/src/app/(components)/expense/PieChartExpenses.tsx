"use client";

import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { Expense, ExpenseGroup } from "@/app/state/api";

type Props = {
  expenses: Expense[];
};

// fixed colors for groups (stable & professional)
const GROUP_COLORS: Record<ExpenseGroup | "Other", string> = {
  Clinical: "#22c55e",                 // green
  "Equipment and Infrastructure": "#3b82f6", // blue
  "Logistics and Overhead": "#f97316", // orange
  Other: "#9ca3af",                    // gray
};

const formatCurrency = (value: number) =>
  `$${value.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

const ExpenseGroupDonutCard = ({ expenses }: Props) => {
  const { donutData, totalAmount } = useMemo(() => {
    const totals: Record<string, number> = {};

    expenses.forEach((e) => {
      const group = (e.group as ExpenseGroup) || "Other";
      totals[group] = (totals[group] ?? 0) + e.amount;
    });

    const total = Object.values(totals).reduce((acc, v) => acc + v, 0);

    const data = Object.entries(totals).map(([name, value]) => ({
      name,
      value,
      percent: total > 0 ? (value / total) * 100 : 0,
      fill: GROUP_COLORS[(name as ExpenseGroup) || "Other"] ?? "#9ca3af",
    }));

    return { donutData: data, totalAmount: total };
  }, [expenses]);

  return (
    <div className="bg-white rounded-2xl shadow border border-slate-200 p-5 flex flex-col">
      {/* Card header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Expense by Group</h3>

        {/* simple timeframe pill for now */}
        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-medium text-slate-600">
          This Month
        </span>
      </div>

      {/* Chart + centre total */}
      <div className="flex justify-center mb-4">
        <div className="relative h-44 w-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                strokeWidth={0}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {donutData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <RechartsTooltip
                formatter={(value: any, _name, props: any) => {
                  const amount = value as number;
                  const percent = props.payload?.percent
                    ? `${props.payload.percent.toFixed(1)}%`
                    : "";
                  return [`${formatCurrency(amount)} (${percent})`, props.payload.name];
                }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Centre label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[11px] text-slate-400">Total Expense</span>
            <span className="text-xl font-bold text-slate-900">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Group list */}
      <div className="space-y-2 text-xs">
        {donutData.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-slate-700">{item.name}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-1.5 py-0.5 rounded-md bg-slate-50 text-[11px] text-slate-500">
                {item.percent.toFixed(0)}%
              </span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(item.value)}
              </span>
            </div>
          </div>
        ))}

        {donutData.length === 0 && (
          <p className="text-slate-400 text-xs text-center mt-2">
            No expenses recorded for this period.
          </p>
        )}
      </div>
    </div>
  );
};

export default ExpenseGroupDonutCard;
