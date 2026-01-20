"use client";

import React, { useMemo } from "react";
import { useGetDashboardMetricsQuery } from "@/app/state/api";
import numeral from "numeral";
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A855F7", "#EF4444"];

type AnyObj = Record<string, any>;

const toNumber = (v: unknown) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  // Prisma Decimal sometimes serializes as { d: ..., ... } depending on your setup
  // but most of the time it is string/number. Fallback:
  try {
    const n = Number((v as any)?.toString?.() ?? v);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
};

const CardPurchaseBreakdown = () => {
  const { data, isLoading, isError } = useGetDashboardMetricsQuery();

  const breakdown = data?.purchaseBreakdown;

  console.log("purchaseBreakdown:", breakdown);
console.log("byCategory:", breakdown?.byCategory);
console.log("byDepartment:", breakdown?.byDepartment);


  // ---- CATEGORY (PIE) ----
  // Normalize possible shapes:
  // - { category, amount }
  // - { Category, amount }
  // - { category, value }
  // Convert to recharts-friendly: { name, value }
  const topCategories = useMemo(() => {
    const raw = (breakdown?.byCategory ?? []) as AnyObj[];

    return raw.slice(0, 6).map((item) => {
      const name =
        item.name ??
        item.category ??
        item.Category ??
        item.group ??
        "Uncategorized";

      const value = toNumber(item.value ?? item.amount ?? item.total ?? 0);

      return { name, value };
    });
  }, [breakdown]);

  // ---- DEPARTMENT (BAR) ----
  // Normalize possible shapes:
  // - { department, amount }
  // - { Department, amount }
  // Convert to: { department, amount:number }
  const deptData = useMemo(() => {
    const raw = (breakdown?.byDepartment ?? []) as AnyObj[];

    return raw.slice(0, 8).map((item) => {
      const department =
        item.department ?? item.Department ?? item.name ?? "Unassigned";

      const amount = toNumber(item.amount ?? item.value ?? item.total ?? 0);

      return { department, amount };
    });
  }, [breakdown]);

  if (isLoading) {
    return (
      <div className="bg-white shadow-md rounded-2xl flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (isError || !breakdown) {
    return (
      <div className="bg-white shadow-md rounded-2xl flex items-center justify-center h-full">
        <div className="text-red-500">Failed to load purchase breakdown</div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-2xl flex flex-col h-full overflow-hidden">
      {/* HEADER */}
      <div className="px-7 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Purchase Breakdown</h2>
          <div className="text-sm text-gray-600">
            Total:{" "}
            <span className="font-semibold">
              {numeral(toNumber(breakdown.total)).format("$0,0.00")}
            </span>
          </div>
        </div>
      </div>
      <hr />

      {/* BODY */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-4 p-6">
        {/* CATEGORY PIE */}
        <div className="rounded-xl bg-slate-50/80 p-4">
          <div className="text-sm font-semibold text-gray-800 mb-2">
            By Category
          </div>

          {topCategories.length > 0 && topCategories.some((c) => c.value > 0) ? (
            <div className="flex items-center gap-4">
              <div className="relative w-[180px] h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(v: any) => numeral(toNumber(v)).format("$0,0.00")}
                    />
                    <Pie
                      data={topCategories}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={60}
                      cx="50%"
                      cy="50%"
                    >
                      {topCategories.map((_, idx) => (
                        <Cell key={idx} fill={colors[idx % colors.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <ul className="text-xs text-gray-700 space-y-2">
                {topCategories.map((c, idx) => (
                  <li key={c.name} className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors[idx % colors.length] }}
                    />
                    <span className="font-medium">{c.name}</span>
                    <span className="text-gray-500">
                      {numeral(toNumber(c.value)).format("$0,0")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="h-[160px] flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">
              No category data yet
            </div>
          )}
        </div>

        {/* DEPARTMENT BAR */}
        <div className="rounded-xl bg-slate-50/80 p-4">
          <div className="text-sm font-semibold text-gray-800 mb-2">
            By Department
          </div>

          {deptData.length > 0 && deptData.some((d) => d.amount > 0) ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={deptData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="department"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={60}
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickFormatter={(v: number) => numeral(toNumber(v)).format("$0a")}
                  />
                  <Tooltip
                    formatter={(v: any) => numeral(toNumber(v)).format("$0,0.00")}
                  />
                  <Bar dataKey="amount" radius={[10, 10, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">
              No department data yet
            </div>
          )}
        </div>
      </div>

      {/* FOOTER (Top Product) */}
      <div className="border-t border-slate-200/80 px-7 py-3 text-xs text-gray-600">
        {breakdown.topProducts?.length ? (
          <span>
            Top item:{" "}
            <span className="font-semibold">{breakdown.topProducts[0].name}</span>{" "}
            ({numeral(toNumber(breakdown.topProducts[0].amount)).format("$0,0.00")})
          </span>
        ) : (
          <span>No line-level product data yet</span>
        )}
      </div>
    </div>
  );
};

export default CardPurchaseBreakdown;
