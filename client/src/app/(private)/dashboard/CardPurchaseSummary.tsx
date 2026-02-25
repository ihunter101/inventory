"use client";

import React, { useMemo, useState } from "react";
import numeral from "numeral";
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  AlertCircle,
  Receipt,
  ArrowUpRight,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useGetDashboardPurchaseSummaryQuery } from "../../state/api";
import type { PurchaseTF } from "../../state/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CardPurchaseSummary: React.FC = () => {
  const [timeframe, setTimeframe] = useState<PurchaseTF>("month");
  const { data, isLoading, isError } = useGetDashboardPurchaseSummaryQuery({
    timeframe,
  });

  const hasData = (data?.series?.length ?? 0) > 0;

  const chartData = useMemo(() => {
    const s = data?.series ?? [];
    return s.map((x) => ({
      ...x,
      dateLabel: x.label,
      totalPurchased: x.paid,
    }));
  }, [data?.series]);

  const totalPaid = data?.totals.paid ?? 0;

  const changePct = useMemo(() => {
    if (chartData.length < 2) return null;
    const last = chartData[chartData.length - 1].totalPurchased;
    const prevTotal = totalPaid - last;
    if (prevTotal <= 0) return null;
    return ((totalPaid - prevTotal) / prevTotal) * 100;
  }, [chartData, totalPaid]);

  const outstanding = data?.status.outstanding ?? 0;
  const invoicesPending = data?.status.invoicesPending ?? 0;
  const highest = data?.insights.highest;

  const paidVsOutstandingPct = useMemo(() => {
    const denom = totalPaid + outstanding;
    if (denom <= 0) return 0;
    return (totalPaid / denom) * 100;
  }, [totalPaid, outstanding]);

  if (isError) return <div className="m-5">Failed to fetch purchase summary</div>;

  return (
    <Card className="h-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">
              Purchase Summary (Paid)
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">{data?.rangeLabel ?? ""}</p>
          </div>

          <Select value={timeframe} onValueChange={(v) => setTimeframe(v as PurchaseTF)}>
            <SelectTrigger className="h-9 w-[120px] rounded-full border border-slate-200 bg-white text-xs shadow-sm">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="quarter">Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      {/* IMPORTANT: flex-1 + min-h-0 prevents clipping bugs */}
      <CardContent className="pt-0 flex-1 min-h-0 flex flex-col">
        {isLoading ? (
          <div className="py-8 text-sm text-slate-500">Loading...</div>
        ) : (
          // This wrapper scrolls if the card is too short, instead of cutting off the footer
          <div className="flex-1 min-h-0 flex flex-col overflow-y-auto pr-1">
            {/* Top KPI */}
            <div className="mb-3 mt-2 shrink-0">
              <p className="text-xs text-slate-500">Total Paid (from Invoice Payments)</p>

              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <p className="text-2xl font-extrabold text-slate-900">
                  {numeral(totalPaid).format("$0,0.00")}
                </p>

                {changePct !== null && (
                  <div
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
                      changePct >= 0
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-red-50 text-red-700 border-red-100"
                    }`}
                  >
                    {changePct >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>{Math.abs(changePct).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Chart grows */}
            <div className="flex-1 min-h-[260px] shrink-0">
              <div className="h-full rounded-2xl bg-slate-50/60 border border-slate-200 p-3">
                {hasData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="dateLabel"
                        tickLine={false}
                        axisLine={false}
                        interval={0}          // ✅ show all labels
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={55}
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        tickFormatter={(value: number) => numeral(value).format("$0a")}
                      />
                      <Tooltip
                        cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                        formatter={(value: number) => [numeral(value).format("$0,0.00"), "Paid"]}
                      />
                      <defs>
                        <linearGradient id="paidArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="totalPurchased"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#paidArea)"
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">
                    No payment data yet
                  </div>
                )}
              </div>
            </div>

            {/* Bottom cards: responsive so they always fit */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 shrink-0">
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Wallet className="h-4 w-4 text-emerald-700" />
                  <span>Paid</span>
                </div>
                <p className="mt-1 text-lg font-extrabold text-slate-900">
                  {numeral(totalPaid).format("$0,0")}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {paidVsOutstandingPct.toFixed(0)}% of (paid + outstanding)
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span>Outstanding</span>
                </div>
                <p className="mt-1 text-lg font-extrabold text-slate-900">
                  {numeral(outstanding).format("$0,0")}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {invoicesPending} pending invoices
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Receipt className="h-4 w-4 text-slate-700" />
                  <span>Highest Paid</span>
                </div>
                <p className="mt-1 text-lg font-extrabold text-slate-900">
                  {highest ? numeral(highest.paid).format("$0,0") : "—"}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {highest ? highest.label : "No data"}
                </p>
              </div>
            </div>

            {/* Footer always visible (or scrollable inside CardContent) */}
            <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-3 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-600">
                <p className="font-semibold text-slate-900">Payments-based Purchases</p>
                <p className="mt-0.5">
                  This chart reflects actual cash outflow (Invoice Payments), not PO estimates.
                </p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-white border border-emerald-100 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4 text-emerald-700" />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CardPurchaseSummary;