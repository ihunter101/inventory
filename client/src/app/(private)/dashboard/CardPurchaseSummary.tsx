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

  if (isError) {
    return (
      <div className="m-5 text-sm text-destructive">
        Failed to fetch purchase summary
      </div>
    );
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/95">
      <CardHeader className="shrink-0 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight text-foreground">
              Purchase Summary (Paid)
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {data?.rangeLabel ?? ""}
            </p>
          </div>

          <Select value={timeframe} onValueChange={(v) => setTimeframe(v as PurchaseTF)}>
            <SelectTrigger className="h-9 w-[120px] rounded-full border border-border/60 bg-background text-xs text-foreground shadow-sm">
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

      <CardContent className="flex min-h-0 flex-1 flex-col pt-0">
        {isLoading ? (
          <div className="py-8 text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
            <div className="mb-3 mt-2 shrink-0">
              <p className="text-xs text-muted-foreground">
                Total Paid (from Invoice Payments)
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-3">
                <p className="text-2xl font-extrabold text-foreground">
                  {numeral(totalPaid).format("$0,0.00")}
                </p>

                {changePct !== null && (
                  <div
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${
                      changePct >= 0
                        ? "border-emerald-200/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "border-red-200/60 bg-red-500/10 text-red-700 dark:text-red-400"
                    }`}
                  >
                    {changePct >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>{Math.abs(changePct).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>

            <div className="min-h-[260px] shrink-0 flex-1">
              <div className="h-full rounded-2xl border border-border/60 bg-muted/30 p-3">
                {hasData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="hsl(var(--border))"
                        opacity={0.35}
                      />
                      <XAxis
                        dataKey="dateLabel"
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={55}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        tickFormatter={(value: number) => numeral(value).format("$0a")}
                      />
                      <Tooltip
                        cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid hsl(var(--border))",
                          backgroundColor: "hsl(var(--popover))",
                          color: "hsl(var(--popover-foreground))",
                        }}
                        formatter={(value: number | undefined) => [
                          numeral(value ?? 0).format("$0,0.00"),
                          "Paid",
                        ]}
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
                  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border/60 text-xs text-muted-foreground">
                    No payment data yet
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-card p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Paid</span>
                </div>
                <p className="mt-1 text-lg font-extrabold text-foreground">
                  {numeral(totalPaid).format("$0,0")}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {paidVsOutstandingPct.toFixed(0)}% of (paid + outstanding)
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span>Outstanding</span>
                </div>
                <p className="mt-1 text-lg font-extrabold text-foreground">
                  {numeral(outstanding).format("$0,0")}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {invoicesPending} pending invoices
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Receipt className="h-4 w-4 text-foreground/80" />
                  <span>Highest Paid</span>
                </div>
                <p className="mt-1 text-lg font-extrabold text-foreground">
                  {highest ? numeral(highest.paid).format("$0,0") : "—"}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {highest ? highest.label : "No data"}
                </p>
              </div>
            </div>

            <div className="mt-3 flex shrink-0 items-center justify-between rounded-2xl border border-emerald-200/40 bg-emerald-500/10 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/30">
              <div className="text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Payments-based Purchases</p>
                <p className="mt-0.5">
                  This chart reflects actual cash outflow (Invoice Payments), not PO estimates.
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200/50 bg-background dark:border-emerald-800/40">
                <ArrowUpRight className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CardPurchaseSummary;