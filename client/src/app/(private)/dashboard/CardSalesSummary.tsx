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

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEK_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function kFormat(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return `${Math.round(n)}`;
}

function monthIndexUTC(iso: string) {
  const d = new Date(iso);
  return d.getUTCMonth();
}

function dayIndexLocal(iso: string) {
  const d = new Date(iso);
  return d.getDay();
}

export default function CardSalesOverview() {
  const [tf, setTf] = useState<SalesOverviewTimeframe>("month");
  const { data, isLoading, isError } = useGetSalesOverviewQuery({ tf });

  const chartData = useMemo(() => {
    if (!data) return [];

    if (tf === "month") {
      const base = MONTH_LABELS.map((label) => ({ label, total: 0 }));
      for (const row of data.sparse) {
        const idx = monthIndexUTC(row.bucketISO);
        base[idx].total += row.total;
      }
      return base;
    }

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
    <Card className="h-full overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/95">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight text-foreground">
              Sales Overview
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {data?.rangeLabel ?? (tf === "month" ? "Last 12 months" : "This week")}
            </p>
          </div>

          <Select value={tf} onValueChange={(v) => setTf(v as SalesOverviewTimeframe)}>
            <SelectTrigger className="h-9 w-[120px] rounded-full border border-border/60 bg-background text-xs text-foreground shadow-sm">
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
          <div className="py-10 text-sm text-destructive">Failed to load.</div>
        ) : isLoading || !data ? (
          <div className="py-10 text-sm text-muted-foreground">Loading...</div>
        ) : (
          <>
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                      strokeOpacity={0.3}
                    />

                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    />

                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={46}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(v: number) => kFormat(v)}
                      domain={[0, Math.ceil(maxVal * 1.15)]}
                    />

                    <Tooltip
                      cursor={{ fill: "hsl(var(--primary) / 0.08)" }}
                      formatter={(value: number | undefined) => [money(value ?? 0), "Sales"]}
                      contentStyle={{
                        borderRadius: "14px",
                        border: "1px solid hsl(var(--border))",
                        backgroundColor: "hsl(var(--popover))",
                        color: "hsl(var(--popover-foreground))",
                        boxShadow: "0 10px 25px rgba(2,6,23,0.12)",
                        fontSize: 12,
                      }}
                    />

                    <Bar
                      dataKey="total"
                      fill="hsl(var(--primary))"
                      barSize={12}
                      radius={[10, 10, 10, 10]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-border/60 bg-card p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Wallet className="h-4 w-4 text-primary" />
                  <span>Total</span>
                </div>
                <p className="mt-1 text-lg font-extrabold text-foreground">
                  {money(data.totals.total)}
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Banknote className="h-4 w-4 text-primary" />
                  <span>Cash</span>
                </div>
                <p className="mt-1 text-lg font-extrabold text-foreground">
                  {money(data.totals.cash)}
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span>Non-cash</span>
                </div>
                <p className="mt-1 text-lg font-extrabold text-foreground">
                  {money(data.totals.nonCash)}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-2xl border border-primary/15 bg-primary/10 p-3 dark:border-primary/20 dark:bg-primary/10">
              <div className="text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Highest Recorded</p>
                <p className="mt-0.5">
                  {data.highest ? `${highestLabel} • ${money(data.highest.total)}` : "No data yet"}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background">
                <ArrowUpRight className="h-4 w-4 text-primary" />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}