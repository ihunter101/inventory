"use client";

import React, { useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useGetSalesByLocationQuery } from "../../state/api";

type Timeframe = "daily" | "weekly" | "monthly";

/** Safe Decimal-string -> number */
function toNumber(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** YYYY-MM-DD UTC */
function dayKeyUTC(d: Date): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

/** Week key is Monday YYYY-MM-DD (UTC) */
function weekKeyUTC(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay(); // 0=Sun
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  date.setUTCDate(date.getUTCDate() + diffToMonday);
  return date.toISOString().slice(0, 10);
}

/** Month key YYYY-MM */
function monthKeyUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getRangeForTimeframe(tf: Timeframe) {
  const end = new Date();
  const start = new Date();

  if (tf === "daily") start.setDate(end.getDate() - 14);     // last 14 days
  if (tf === "weekly") start.setDate(end.getDate() - 90);    // last ~13 weeks
  if (tf === "monthly") start.setFullYear(end.getFullYear() - 1); // last 12 months

  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

const CardSalesSummary = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>("weekly");

  const { startDate, endDate } = useMemo(
    () => getRangeForTimeframe(timeframe),
    [timeframe]
  );

  // ✅ REAL SALES rows from DB
  const { data, isLoading, isError } = useGetSalesByLocationQuery({
    startDate,
    endDate,
  });

  const rawSales = data?.sales ?? [];

  // Build chart buckets from real Sale rows
  const chartData = useMemo(() => {
    const map = new Map<
      string,
      { key: string; dateForLabel: Date; totalValue: number }
    >();

    for (const s of rawSales) {
      const d = new Date(s.salesDate);
      if (Number.isNaN(d.getTime())) continue;

      const total = toNumber(s.grandTotal);

      let key: string;
      let labelDate: Date;

      if (timeframe === "daily") {
        key = dayKeyUTC(d);
        labelDate = new Date(`${key}T00:00:00Z`);
      } else if (timeframe === "weekly") {
        key = weekKeyUTC(d); // Monday
        labelDate = new Date(`${key}T00:00:00Z`);
      } else {
        key = monthKeyUTC(d); // YYYY-MM
        labelDate = new Date(`${key}-01T00:00:00Z`);
      }

      const prev = map.get(key);
      if (!prev) {
        map.set(key, { key, dateForLabel: labelDate, totalValue: total });
      } else {
        prev.totalValue += total;
      }
    }

    return Array.from(map.values())
      .sort((a, b) => a.dateForLabel.getTime() - b.dateForLabel.getTime())
      .map((x) => ({
        salesDateLabel: x.key, // x-axis
        totalValue: Number(x.totalValue.toFixed(2)), // y-value
        dateForLabel: x.dateForLabel.toISOString(), // tooltip helper
      }));
  }, [rawSales, timeframe]);

  const hasData = chartData.length > 0;

  const totalSalesValue = useMemo(() => {
    return chartData.reduce((acc, cur) => acc + cur.totalValue, 0);
  }, [chartData]);

  const { latestSalesChangePercent, averageSalesPercentChange } = useMemo(() => {
    let latest: number | null = null;
    let avg: number | null = null;

    if (chartData.length < 2) return { latestSalesChangePercent: latest, averageSalesPercentChange: avg };

    let sum = 0;
    let count = 0;

    for (let i = 1; i < chartData.length; i++) {
      const prev = chartData[i - 1].totalValue;
      const curr = chartData[i].totalValue;

      if (prev > 0) {
        const change = ((curr - prev) / prev) * 100;
        sum += change;
        count += 1;
        if (i === chartData.length - 1) latest = change;
      }
    }

    if (count > 0) avg = sum / count;

    return { latestSalesChangePercent: latest, averageSalesPercentChange: avg };
  }, [chartData]);

  const highest = useMemo(() => {
    if (!chartData.length) return null;
    return chartData.reduce((acc, cur) => (acc.totalValue > cur.totalValue ? acc : cur));
  }, [chartData]);

  const highestSalesDate = useMemo(() => {
    if (!highest) return null;

    if (timeframe === "monthly") {
      const d = new Date(highest.dateForLabel);
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }

    const d = new Date(`${highest.salesDateLabel}T00:00:00Z`);
    return d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" });
  }, [highest, timeframe]);

  if (isError) return <div className="m-5">Failed to fetch data</div>;

  return (
    <div className="rounded-2xl bg-white shadow-md flex flex-col h-full overflow-hidden">
      {isLoading ? (
        <div className="m-5">Loading...</div>
      ) : (
        <>
          {/* Top */}
          <div className="px-7 pt-5 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Sales Summary</h2>

              <div className="flex flex-col items-end gap-2">
                {latestSalesChangePercent !== null && (
                  <div
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                      latestSalesChangePercent >= 0
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>{latestSalesChangePercent.toFixed(2)}%</span>
                  </div>
                )}

                <select
                  className="shadow-sm border border-gray-200 bg-white px-3 py-1.5 rounded text-xs"
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as Timeframe)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <p className="text-xs font-medium text-gray-400 mb-1">Value</p>
            <p className="text-3xl font-extrabold text-gray-900">
              ${totalSalesValue.toFixed(2)}
            </p>

            {averageSalesPercentChange !== null && (
              <p className="text-xs text-gray-500 mt-1">
                Avg Change:{" "}
                <span className="font-semibold">
                  {averageSalesPercentChange.toFixed(2)}%
                </span>
              </p>
            )}
          </div>

          {/* Bottom */}
          <div className="bg-slate-50/80 flex-1 flex flex-col">
            <div className="flex-1 px-7 pt-3 pb-4">
              <div className="h-52">
                {hasData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />

                      <XAxis
                        dataKey="salesDateLabel"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        tickFormatter={(value) => {
                          if (timeframe === "monthly") {
                            const [y, m] = String(value).split("-");
                            return `${Number(m)}/${String(y).slice(2)}`;
                          }
                          const d = new Date(`${value}T00:00:00Z`);
                          return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
                        }}
                      />

                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={70}
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        tickFormatter={(value: number) =>
                          value >= 1000 ? `$${(value / 1000).toFixed(1)}k` : `$${value.toFixed(0)}`
                        }
                        domain={[0, "dataMax + 50"]}
                      />

                      <Tooltip
                        formatter={(value: number) => [`$${value.toLocaleString("en-US")}`, "Total"]}
                        labelFormatter={(label) => {
                          if (timeframe === "monthly") {
                            const d = new Date(`${label}-01T00:00:00Z`);
                            return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
                          }
                          const d = new Date(`${label}T00:00:00Z`);
                          return d.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          });
                        }}
                      />

                      <Bar dataKey="totalValue" fill="#3182ce" barSize={10} radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">
                    No sales data yet
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200/80 px-7 py-3 flex items-center justify-between text-xs text-gray-600">
              <div>
                <p className="font-semibold">
                  {chartData.length}{" "}
                  {timeframe === "daily" ? "days" : timeframe === "weekly" ? "weeks" : "months"}
                </p>
                <p className="text-[11px] text-gray-400">in this range</p>
              </div>

              <div className="text-right">
                <p className="uppercase tracking-wide text-[11px] text-gray-400">
                  Highest Sales {timeframe === "monthly" ? "Month" : "Date"}
                </p>
                <p className="font-semibold">{highestSalesDate ?? "N/A"}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CardSalesSummary;
