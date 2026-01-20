"use client";

import React, { useMemo } from "react";
import { useGetDashboardMetricsQuery } from "../../state/api";
import numeral from "numeral";
import { TrendingDown, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CardPurchaseSummary: React.FC = () => {
  const { data, isLoading, isError } = useGetDashboardMetricsQuery();

  const rawPurchaseData = data?.purchaseSummary ?? [];
  const hasData = rawPurchaseData.length > 0;

  const purchaseData = useMemo(() => {
    return rawPurchaseData
      .map((item) => {
        const d = new Date(item.date);
        return {
          ...item,
          dateObject: d,
          dateLabel: d.toISOString().slice(0, 10),
          totalPurchased: item.amount, // ✅ alias so you change fewer chart lines
        };
      })
      .sort((a, b) => a.dateObject.getTime() - b.dateObject.getTime());
  }, [rawPurchaseData]);

  const totalPurchases = useMemo(() => {
    return rawPurchaseData.reduce((total, inv) => total + (inv.amount ?? 0), 0);
  }, [rawPurchaseData]);

  // % change based on last point vs previous subtotal
  const purchaseChangePercentage = useMemo(() => {
    if (purchaseData.length < 2) return null;

    const last = purchaseData[purchaseData.length - 1].totalPurchased; // amount
    const prevTotal = totalPurchases - last;

    if (prevTotal === 0) return null;
    return ((totalPurchases - prevTotal) / prevTotal) * 100;
  }, [purchaseData, totalPurchases]);

  if (isError) return <div className="m-5">Failed to fetch data</div>;

  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-md h-full">
      {isLoading ? (
        <div className="m-5">Loading...</div>
      ) : (
        <>
          <div>
            <h2 className="text-lg font-semibold mb-2 px-7 pt-5">
              Purchase Summary
            </h2>
            <hr />
          </div>

          <div className="flex-1 flex flex-col">
            <div className="mb-4 mt-7 px-7">
              <p className="text-xs text-gray-400">Total Purchases</p>

              <div className="flex items-center">
                <p className="text-2xl font-bold">
                  {numeral(totalPurchases).format("$0,0.00")}
                </p>

                {purchaseChangePercentage !== null && (
                  <p
                    className={`text-sm flex ml-3 ${
                      purchaseChangePercentage >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {purchaseChangePercentage >= 0 ? (
                      <TrendingUp className="w-5 h-5 mr-1" />
                    ) : (
                      <TrendingDown className="w-5 h-5 mr-1" />
                    )}
                    {Math.abs(purchaseChangePercentage).toFixed(1)}%
                  </p>
                )}
              </div>
            </div>

            <div className="flex-1 px-3 pb-5">
              <div className="h-48">
                {hasData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={purchaseData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />

                      <XAxis
                        dataKey="dateLabel"
                        tickLine={false}
                        axisLine={false}
                        minTickGap={20}
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        tickFormatter={(value: string) =>
                          new Date(value).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        }
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
                        formatter={(value: number) => [
                          numeral(value).format("$0,0.00"),
                          "Invoice Amount",
                        ]}
                        labelFormatter={(label) =>
                          new Date(label as string).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        }
                      />

                      <defs>
                        <linearGradient id="purchaseArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>

                      <Area
                        type="monotone"
                        dataKey="totalPurchased" // ✅ still works because we aliased it
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="url(#purchaseArea)"
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">
                    No purchase data yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CardPurchaseSummary;
