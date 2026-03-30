"use client";

import { ShoppingBagIcon } from "lucide-react";
import { useGetDashboardMetricsQuery } from "../../state/api";
import Rating from "../../(components)/Rating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CardPopularProducts = () => {
  const { data: dashboardMetrics, isLoading } = useGetDashboardMetricsQuery();

  return (
    <Card className="h-full overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/95">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold tracking-tight text-foreground">
          Popular Products
        </CardTitle>
      </CardHeader>

      <CardContent className="flex h-[calc(100%-56px)] flex-col pt-0">
        {isLoading ? (
          <div className="py-6 text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="divide-y divide-border/60">
              {dashboardMetrics?.popularIssuedProducts?.map((product) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between gap-3 py-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted/50">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="px-1 text-center text-[10px] text-muted-foreground">
                          No Image
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate font-semibold text-foreground">
                        {product.name}
                      </div>

                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-primary">
                          {/* ${product.price} */}
                        </span>
                        <span className="text-border">|</span>
                        <Rating rating={product.rate || 0} />
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                      <ShoppingBagIcon className="h-4 w-4" />
                      <span>{product.qtyIssued}</span>
                    </div>
                  </div>
                </div>
              ))}

              {!dashboardMetrics?.popularIssuedProducts?.length && (
                <div className="py-8 text-sm text-muted-foreground">
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