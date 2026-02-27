"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetSalesOverviewQuery } from "../../state/api";
import type { SalesOverviewTimeframe } from "../../state/api";
import { ArrowUpRight, Wallet, Banknote, CreditCard } from "lucide-react";

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEK_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function kFormat(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return `${Math.round(n)}`;
}

function monthIndexUTC(iso: string) {
  const d = new Date(iso);
  return d.getUTCMonth(); // 0..11
}

function dayIndexLocal(iso: string) {
  // week mode uses local week days
  const d = new Date(iso);
  return d.getDay(); // 0=Sun..6=Sat
}

export default function CardSalesOverview() {
  const [tf, setTf] = useState<SalesOverviewTimeframe>("month");
  const { data, isLoading, isError } = useGetSalesOverviewQuery({ tf });

  const chartData = useMemo(() => {
    if (!data) return [];

    if (tf === "month") {
      // build full Jan..Dec
      const base = MONTH_LABELS.map((label) => ({ label, total: 0 }));
      for (const row of data.sparse) {
        const idx = monthIndexUTC(row.bucketISO);
        base[idx].total += row.total;
      }
      return base;
    }

    // week: build Sun..Sat
    const base = WEEK_LABELS.map((label) => ({ label, total: 0 }));
    for (const row of data.sparse) {
      const idx = dayIndexLocal(row.bucketISO);
      base[idx].total += row.total;
    }
    return base;
  }, [data, tf]);

  const maxVal = useMemo(() => Math.max(...chartData.map((x) => x.total), 0), [chartData]);

  const highestLabel = useMemo(() => {
    if (!data?.highest) return "N/A";
    const iso = data.highest.bucketISO;

    if (tf === "month") {
      return MONTH_LABELS[monthIndexUTC(iso)];
    }
    return WEEK_LABELS[dayIndexLocal(iso)];
  }, [data?.highest, tf]);

  return (
    <Card className="h-full rounded-2xl border border-emerald-100/70 bg-white shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight text-slate-900">
              Sales Overview
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">{data?.rangeLabel ?? (tf === "month" ? "Last 12 months" : "This week")}</p>
          </div>

          <Select value={tf} onValueChange={(v) => setTf(v as SalesOverviewTimeframe)}>
            <SelectTrigger className="h-9 w-[120px] rounded-full border border-emerald-100 bg-white text-xs shadow-sm">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {isError ? (
          <div className="py-10 text-sm text-red-600">Failed to load.</div>
        ) : isLoading || !data ? (
          <div className="py-10 text-sm text-slate-500">Loading...</div>
        ) : (
          <>
            {/* Chart area */}
            <div className="rounded-2xl bg-emerald-50/40 border border-emerald-100/70 p-3">
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.25} />

                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />

                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={46}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickFormatter={(v: number) => kFormat(v)}
                      domain={[0, Math.ceil(maxVal * 1.15)]}
                    />

                    <Tooltip
                      cursor={{ fill: "rgba(16,185,129,0.08)" }}
                      formatter={(value: number) => [money(value), "Sales"]}
                      contentStyle={{
                        borderRadius: 14,
                        border: "1px solid rgba(16,185,129,0.18)",
                        boxShadow: "0 10px 25px rgba(2,6,23,0.08)",
                        fontSize: 12,
                      }}
                    />

                    <Bar
                      dataKey="total"
                      fill="rgba(16,185,129,0.95)"
                      barSize={12}
                      radius={[10, 10, 10, 10]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom stats strip (like your Expense Summary) */}
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Wallet className="h-4 w-4 text-emerald-700" />
                  <span>Total</span>
                </div>
                <p className="mt-1 text-lg font-extrabold text-slate-900">{money(data.totals.total)}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Banknote className="h-4 w-4 text-emerald-700" />
                  <span>Cash</span>
                </div>
                <p className="mt-1 text-lg font-extrabold text-slate-900">{money(data.totals.cash)}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CreditCard className="h-4 w-4 text-emerald-700" />
                  <span>Non-cash</span>
                </div>
                <p className="mt-1 text-lg font-extrabold text-slate-900">{money(data.totals.nonCash)}</p>
              </div>
            </div>

            {/* Highest record */}
            <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-3 flex items-center justify-between">
              <div className="text-xs text-slate-600">
                <p className="font-semibold text-slate-900">Highest Recorded</p>
                <p className="mt-0.5">
                  {data.highest ? `${highestLabel} • ${money(data.highest.total)}` : "No data yet"}
                </p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-white border border-emerald-100 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4 text-emerald-700" />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}