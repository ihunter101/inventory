"use client";

import { CheckCircle, Package, Tag, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import { useGetPendingPromotionsCountQuery } from "@/app/state/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CardExpenseSummary from "./CardExpenseSummary";
import CardPopularProducts from "./CardPopularProducts";
import CardPurchaseSummary from "./CardPurchaseSummary";
import CardSalesSummary from "./CardSalesSummary";
import StatCard from "./StatCard";

export default function DashboardClient() {
  const router = useRouter();
  const { data: pendingCount } = useGetPendingPromotionsCountQuery();
  const count = pendingCount?.count ?? 0;

  return (
    <div className="flex flex-col gap-10 pb-4">
      {/* Smart Pending Promotions Alert */}
      {count > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
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
              You have <strong>{count}</strong> draft product{count !== 1 ? "s" : ""} from posted
              GRNs that need category, department, and image assignment.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
        <CardPopularProducts />
        <CardSalesSummary />
        <CardPurchaseSummary />
        <CardExpenseSummary />

        <StatCard
          title="Customer & Expenses"
          primaryIcon={<Package className="text-blue-600 w-6 h-6" />}
          dateRange="22 - 29 October 2023"
          details={[
            { title: "Customer Growth", amount: "175.00", changePercentage: 131, IconComponent: TrendingUp },
            { title: "Expenses", amount: "10.00", changePercentage: -56, IconComponent: TrendingDown },
          ]}
        />

        <StatCard
          title="Dues & Pending Orders"
          primaryIcon={<CheckCircle className="text-blue-600 w-6 h-6" />}
          dateRange="22 - 29 October 2023"
          details={[
            { title: "Dues", amount: "250.00", changePercentage: 131, IconComponent: TrendingUp },
            { title: "Pending Orders", amount: "147", changePercentage: -56, IconComponent: TrendingDown },
          ]}
        />

        <StatCard
          title="Sales & Discount"
          primaryIcon={<Tag className="text-blue-600 w-6 h-6" />}
          dateRange="22 - 29 October 2023"
          details={[
            { title: "Sales", amount: "1000.00", changePercentage: 20, IconComponent: TrendingUp },
            { title: "Discount", amount: "200.00", changePercentage: -10, IconComponent: TrendingDown },
          ]}
        />
      </div>
    </div>
  );
}