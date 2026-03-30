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
      <div className="flex h-full items-center justify-center rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isError || !breakdown) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="text-sm font-medium text-destructive">
          Failed to load purchase breakdown
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      {/* HEADER */}
      <div className="px-7 pb-3 pt-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Purchase Breakdown
          </h2>
          <div className="text-sm text-muted-foreground">
            Total:{" "}
            <span className="font-semibold text-foreground">
              {numeral(toNumber(breakdown.total)).format("$0,0.00")}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60" />

      {/* BODY */}
      <div className="grid flex-1 grid-cols-1 gap-4 p-6 xl:grid-cols-2">
        {/* CATEGORY PIE */}
        <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
          <div className="mb-2 text-sm font-semibold text-foreground">
            By Category
          </div>

          {topCategories.length > 0 && topCategories.some((c) => c.value > 0) ? (
            <div className="flex items-center gap-4">
              <div className="relative h-[160px] w-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid hsl(var(--border))",
                        backgroundColor: "hsl(var(--popover))",
                        color: "hsl(var(--popover-foreground))",
                      }}
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

              <ul className="space-y-2 text-xs text-muted-foreground">
                {topCategories.map((c, idx) => (
                  <li key={c.name} className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: colors[idx % colors.length] }}
                    />
                    <span className="font-medium text-foreground">{c.name}</span>
                    <span className="text-muted-foreground">
                      {numeral(toNumber(c.value)).format("$0,0")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex h-[160px] items-center justify-center rounded-xl border border-dashed border-border/60 text-xs text-muted-foreground">
              No category data yet
            </div>
          )}
        </div>

        {/* DEPARTMENT BAR */}
        <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
          <div className="mb-2 text-sm font-semibold text-foreground">
            By Department
          </div>

          {deptData.length > 0 && deptData.some((d) => d.amount > 0) ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={deptData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                    opacity={0.35}
                  />
                  <XAxis
                    dataKey="department"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={60}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v: number) => numeral(toNumber(v)).format("$0a")}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--popover))",
                      color: "hsl(var(--popover-foreground))",
                    }}
                    formatter={(v: any) => numeral(toNumber(v)).format("$0,0.00")}
                  />
                  <Bar
                    dataKey="amount"
                    radius={[10, 10, 0, 0]}
                    barSize={14}
                    fill="hsl(var(--primary))"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-border/60 text-xs text-muted-foreground">
              No department data yet
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-t border-border/60 px-7 py-3 text-xs text-muted-foreground">
        {breakdown.topProducts?.length ? (
          <span>
            Top item:{" "}
            <span className="font-semibold text-foreground">
              {breakdown.topProducts[0].name}
            </span>{" "}
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