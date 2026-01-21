
// ============================================
// client/src/app/sales/analytics/page.tsx
// ============================================
"use client";

import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { SalesAnalyticsDashboard } from "@/app/(components)/sales/SalesAnalyticsDashboard";
import { useUserRole } from "@/app/hooks/useUserRole";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

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
  <div className="mb-6">
    <Breadcrumb>
      <BreadcrumbList className="text-sm text-muted-foreground">
        <BreadcrumbItem>
          <BreadcrumbLink
            href="/sales"
            className=" text-2xl rounded-md px-1 py-0.5 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
          >
            Sales
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator className="text-muted-foreground/40" />

        <BreadcrumbItem>
          <BreadcrumbPage className=" text-md rounded-full bg-emerald-50 px-3 py-1 text-emerald-800 font-semibold dark:bg-emerald-950/40 dark:text-emerald-300">
            Sales Analytics
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  </div>

  <SalesAnalyticsDashboard />
</div>

  );
}