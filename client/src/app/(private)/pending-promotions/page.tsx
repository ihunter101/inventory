"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useGetPendingPromotionsQuery } from "@/app/state/api";
import { Skeleton } from "@/components/ui/skeleton";
import { NewArrivals } from "@/app/(private)/dashboard/NewArrivals";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function PendingPromotionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const grnId = searchParams.get("grnId");
  
  const { data: drafts = [], isLoading } = useGetPendingPromotionsQuery(
    grnId ? { grnId } : undefined
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl p-6 space-y-3">
        <Skeleton className="h-8 w-[280px]" />
        <Skeleton className="h-[280px] w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <CardTitle>Pending Promotions</CardTitle>
          </div>
          <CardDescription>
            These are draft products received on POSTED GRNs that still need category/department + publishing.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing: <span className="font-medium text-foreground">{drafts?.length ?? 0}</span> item{drafts?.length !== 1 ? 's' : ''}
            {grnId && <> (for GRN <span className="font-mono">{grnId.slice(0, 8)}...</span>)</>}
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>

      {/* Empty State */}
      {!isLoading && drafts.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <AlertCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {grnId 
                ? "This GRN has no pending products to promote." 
                : "There are no pending products to promote at this time."}
            </p>
            <Button 
              variant="outline" 
              onClick={() => router.push("/dashboard")}
              className="mt-4"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Product Promotion Form */}
      {drafts.length > 0 && <NewArrivals />}
    </div>
  );
}