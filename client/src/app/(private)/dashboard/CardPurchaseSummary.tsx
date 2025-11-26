"use client";

import React from "react";
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

let purchaseChangePercentage: number | null = null;

const CardPurchaseSummary: React.FC = () => {
  const { data, isLoading } = useGetDashboardMetricsQuery();
  const rawPurchaseData = data?.purchaseSummary || [];
  const hasData = rawPurchaseData.length > 0;

  const purchaseData = rawPurchaseData.map((item)=>{
    const d = new Date(item.date);
    return {
      ...item,
      dateObject: d,
      dateLabel: d.toISOString().slice(0, 10)
    }
  }).
  sort((a, b) => (a.dateObject.getTime() - b.dateObject.getTime()));

  // Last point of data, or null if empty
  const lastDataPoint = hasData ? rawPurchaseData[rawPurchaseData.length - 1] : null;

  const totalPurchases = rawPurchaseData.reduce((total, item) => ( total + item.totalPurchased), 0)

  if (purchaseData.length >= 2) {
    const oldItem = purchaseData[purchaseData.length -1]
    const oldItemPurchase = oldItem.totalPurchased

    const prevTotal = totalPurchases - oldItemPurchase

     purchaseChangePercentage = prevTotal === 0 ? null : ((totalPurchases - prevTotal) /prevTotal) * 100
    
  }

  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-md h-full">
      {isLoading ? (
        <div className="m-5">Loading...</div>
      ) : (
        <>
          {/* HEADER */}
          <div>
            <h2 className="text-lg font-semibold mb-2 px-7 pt-5">
              Purchase Summary
            </h2>
            <hr />
          </div>

          {/* BODY */}
          <div className="flex-1 flex flex-col">
            {/* BODY HEADER (amount + % change) */}
            <div className="mb-4 mt-7 px-7">
              <p className="text-xs text-gray-400">Total Purchases</p>
              <div className="flex items-center">
                <p className="text-2xl font-bold">
                  {totalPurchases > 0 && numeral(totalPurchases).format("$00.00")}
                </p>

                {purchaseData && (
                  <p
                    className={`text-sm flex ml-3 ${
                      purchaseChangePercentage! >= 0
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {purchaseChangePercentage! >= 0 ? (
                      <TrendingUp className="w-5 h-5 mr-1" />
                    ) : (
                      <TrendingDown className="w-5 h-5 mr-1" />
                    )}
                    {Math.abs(purchaseChangePercentage!).toFixed(1)}%
                  </p>
                )}
              </div>
            </div>

            {/* CHART AREA */}
            <div className="flex-1 px-3 pb-5">
              <div className="h-48">
                {hasData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={purchaseData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
                    >
                      {/* soft grid for “pro” look */}
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />

                      {/* X axis – pretty dates, no ugly ISO string */}
                      <XAxis
                        dataKey="dateLabel"
                        tickLine={false}
                        axisLine={false}
                        minTickGap={20}
                        tick={{ fontSize: 11, fill: "#9ca3af" }} // gray-400
                        tickFormatter={(value: string) =>
                          new Date(value).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        }
                      />

                      {/* Y axis – compact money ticks */}
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={55}
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        tickFormatter={(value: number) =>
                          numeral(value).format("$0a")
                        }
                      />

                      {/* Tooltip – formatted value + readable date */}
                      <Tooltip
                        cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }} // gray-200
                        formatter={(value: number) => [
                          numeral(value).format("$0,0.00"),
                          "Total Purchased",
                        ]}
                        labelFormatter={(label) =>
                          new Date(label as string).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        }
                      />

                      {/* Gradient definition for modern area fill */}
                      <defs>
                        <linearGradient
                          id="purchaseArea"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop
                            offset="100%"
                            stopColor="#6366f1"
                            stopOpacity={0.05}
                          />
                        </linearGradient>
                      </defs>

                      {/* Area line */}
                      <Area
                        type="monotone"
                        dataKey="totalPurchased"
                        stroke="#6366f1"          // indigo-500
                        strokeWidth={2}
                        fill="url(#purchaseArea)" // use gradient
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  // clean empty state if no data
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
