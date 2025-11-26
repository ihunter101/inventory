import { useGetDashboardMetricsQuery } from "../../state/api";
import { TrendingUp } from "lucide-react";
import React, { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CardSalesSummary = () => {
  let salesChangePercentage: number | null = null;

  const { data, isLoading, isError } = useGetDashboardMetricsQuery();
  const rawSalesData = data?.salesSummary || [];

  const [timeframe, setTimeframe] = useState("weekly");

  const salesData = rawSalesData.map((item) => {
    const salesDate = new Date(item.date);
    return {
      ...item,
      salesDateObject: salesDate,
      salesDateLabel: salesDate.toISOString().slice(0, 10),
    };
  });

  //sanity Check to ensure we have Data
  const hasData = salesData.length > 0;

  // caluclate the total sales
  const totalSalesValue = salesData.reduce(
    (acc, currentItem) => acc + currentItem.totalValue,
    0
  );

  // Calculate the Change Percentage and average Change Percentage
  let latestSalesChangePercent: number | null = null;
  let averageSalesPercentChange: number | null = null;
  if (salesData.length >= 2) {
    let sumOfChanges = 0;
    let sumCount = 0;

    for (let i = 1; i < salesData.length; i++) {
      const previousTotalSales = salesData[i - 1].totalValue;
      const currentTotalSales = salesData[i].totalValue;

      if (previousTotalSales > 0) {
        const ChangePercentage =
          ((currentTotalSales - previousTotalSales) / previousTotalSales) * 100;

        sumOfChanges += ChangePercentage;
        sumCount += 1;

        if (i === salesData.length - 1) {
          latestSalesChangePercent = ChangePercentage;
        }
      }
    }
    if (sumCount > 0) {
      averageSalesPercentChange = sumOfChanges / sumCount;
    }
  }

  const highestSalesData =
    salesData.length > 0
      ? salesData.reduce((accumulator, currentItem) =>
          accumulator.totalValue > currentItem.totalValue
            ? accumulator
            : currentItem
        )
      : null;

  //Caluculate The Highest Sales Date
  const highestSalesDate = highestSalesData?.date
    ? new Date(highestSalesData.date).toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "2-digit",
      })
    : null;

  if (isError) {
    return <div className="m-5">Failed to fetch data</div>;
  }

  return (
     <div className="rounded-2xl bg-white shadow-md flex flex-col h-full overflow-hidden">
      {isLoading ? (
        <div className="m-5">Loading...</div>
      ) : (
        <>
          {/* TOP SECTION (title + big value + change pill + timeframe) */}
          <div className="px-7 pt-5 pb-4">
            {/* Title row */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                Sales Summary
              </h2>

              <div className="flex flex-col items-end gap-2">
                {latestSalesChangePercent !== null && (
                  <div
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold
                    ${
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
                  onChange={(e) => setTimeframe(e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            {/* Big value + avg change */}
            <div>
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
          </div>

          {/* BOTTOM SECTION (slightly darker background + chart + footer stats) */}
          <div className="bg-slate-50/80 flex-1 flex flex-col">
            {/* Chart */}
            <div className="flex-1 px-7 pt-3 pb-4">
              <div className="h-52">
                {hasData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={salesData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="salesDateLabel"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={70}
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        tickFormatter={(value: number) => {
                          if (value >= 1000) {
                            return `$${(value / 1000).toFixed(1)}k`;
                          }
                          return `$${value.toFixed(0)}`;
                        }}
                        domain={[0, "dataMax + 50"]}
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          `$${value.toLocaleString("en")}`,
                        ]}
                        labelFormatter={(label) => {
                          const date = new Date(label);
                          return date.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          });
                        }}
                      />
                      <Bar
                        dataKey="totalValue"
                        fill="#3182ce"
                        barSize={10}
                        radius={[10, 10, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">
                    No sales data yet
                  </div>
                )}
              </div>
            </div>

            {/* Bottom stats strip */}
            <div className="border-t border-slate-200/80 px-7 py-3 flex items-center justify-between text-xs text-gray-600">
              <div>
                <p className="font-semibold">{salesData.length || 0} days</p>
                <p className="text-[11px] text-gray-400">in this range</p>
              </div>

              <div className="text-right">
                <p className="uppercase tracking-wide text-[11px] text-gray-400">
                  Highest Sales Date
                </p>
                <p className="font-semibold">
                  {highestSalesDate ?? "N/A"}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CardSalesSummary;
