// DashboardClient.tsx
"use client";

import { AlertCircle } from "lucide-react";
import { useGetPendingPromotionsCountQuery, useGetDashboardMetricsQuery } from "@/app/state/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import CardPopularProducts from "./CardPopularProducts";
import CardRevenueAndProfit from "./CardRevenueSummary";
import CardPurchaseSummary from "./CardPurchaseSummary";
import CardSalesSummary from "./CardSalesSummary";
import CardExpenseSummary from "./CardExpenseSummary";
import CardPurchaseBreakdown from "./PurchaseBreakdown";
import CardOrderSummary from "./CardOrderSummary"; // ✅ NEW IMPORT

export default function DashboardClient() {
  const router = useRouter();
  const { data: pendingCount } = useGetPendingPromotionsCountQuery();
  const { data: dashboardMetrics, isLoading } = useGetDashboardMetricsQuery();
  const count = pendingCount?.count ?? 0;

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Pending Promotions Alert */}
      {count > 0 && (
        <Card className="border-orange-200 bg-orange-50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-base font-semibold text-orange-900">
                  Pending Product Promotions
                </CardTitle>
              </div>
              <Button
                onClick={() => router.push("/pending-promotions")}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700"
              >
                Review {count} Product{count !== 1 ? "s" : ""}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-700">
              You have <strong>{count}</strong> draft product{count !== 1 ? "s" : ""} from posted GRNs
              that need category, department, and image assignment.
            </p>
          </CardContent>
        </Card>
      )}

      {/* DASHBOARD GRID */}
      <div
        className="
          grid grid-cols-12 gap-6 items-stretch
          auto-rows-[420px] md:auto-rows-[440px] xl:auto-rows-[420px]
        "
      >
        {/* ROW 1 */}
        <div className="col-span-12 xl:col-span-4 h-full">
          <CardPopularProducts />
        </div>

        <div className="col-span-12 xl:col-span-8 h-full">
          <CardRevenueAndProfit />
        </div>

        {/* ROW 2 */}
        <div className="col-span-12 md:col-span-6 xl:col-span-4 h-full">
          <CardPurchaseSummary />
        </div>

        <div className="col-span-12 md:col-span-6 xl:col-span-4 h-full">
          <CardSalesSummary />
        </div>

        <div className="col-span-12 md:col-span-12 xl:col-span-4 h-full">
          <CardExpenseSummary />
        </div>

        {/* ROW 3 */}
        <div className="col-span-12 xl:col-span-8 h-full">
          <CardPurchaseBreakdown />
        </div>

        {/* ✅ NEW: Order Summary Card */}
        <div className="col-span-12 xl:col-span-4 h-full">
          <CardOrderSummary metrics={dashboardMetrics?.PurchaseMetrics} />
        </div>
      </div>
    </div>
  );
}