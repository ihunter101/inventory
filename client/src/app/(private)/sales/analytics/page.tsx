
// ============================================
// client/src/app/sales/analytics/page.tsx
// ============================================
"use client";

import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { SalesAnalyticsDashboard } from "@/app/(components)/sales/SalesAnalyticsDashboard";
import { useUserRole } from "@/app/hooks/useUserRole";

export default function SalesAnalyticsPage() {
  const { user, isLoaded } = useUser();
  const { role, isLoading } = useUserRole();

  if (!isLoaded || isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    redirect("/sign-in");
  }

  // Only admin and manager can access analytics
  // if (role !== "admin" && role !== "manager") {
  //   return (
  //     <div className="container mx-auto py-8 px-4">
  //       <div className="bg-red-50 border border-red-200 rounded-lg p-6">
  //         <h2 className="text-xl font-semibold text-red-800">Access Denied</h2>
  //         <p className="text-red-600 mt-2">
  //           You don't have permission to view analytics. Contact your administrator.
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="container mx-auto py-8 px-4">
      <SalesAnalyticsDashboard />
    </div>
  );
}