"use client";

import { ShoppingBagIcon } from "lucide-react";
import { useGetDashboardMetricsQuery } from "../../state/api";
import Rating from "../../(components)/Rating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CardPopularProducts = () => {
  const { data: dashboardMetrics, isLoading } = useGetDashboardMetricsQuery();

  return (
    <Card className="h-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold tracking-tight">
          Popular Products
        </CardTitle>
      </CardHeader>

      {/* IMPORTANT: CardContent must be a flex column and fill remaining space */}
      <CardContent className="pt-0 h-[calc(100%-56px)] flex flex-col">
        {isLoading ? (
          <div className="py-6 text-sm text-slate-500">Loading...</div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="divide-y divide-slate-100">
              {dashboardMetrics?.popularIssuedProducts?.map((product) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between gap-3 py-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-500 text-center px-1">
                          No Image
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 truncate">
                        {product.name}
                      </div>

                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-blue-600">
                          {/* ${product.price} */}
                        </span>
                        <span className="text-slate-300">|</span>
                        <Rating rating={product.rate || 0} />
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium">
                      <ShoppingBagIcon className="w-4 h-4" />
                      <span>{product.qtyIssued}</span>
                    </div>
                  </div>
                </div>
              ))}

              {!dashboardMetrics?.popularIssuedProducts?.length && (
                <div className="py-8 text-sm text-slate-500">
                  No popular products yet.
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CardPopularProducts;
