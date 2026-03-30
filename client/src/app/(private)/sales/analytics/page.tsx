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
} from "@/components/ui/breadcrumb";

export default function SalesAnalyticsPage() {
  const { user, isLoaded } = useUser();
  const { role, isLoading } = useUserRole();

  if (!isLoaded || isLoading) {
    return <div className="px-4 py-8 text-muted-foreground">Loading...</div>;
  }

  if (!user) {
    redirect("/sign-in");
  }

  // Only admin and manager can access analytics
  // if (role !== "admin" && role !== "manager") {
  //   return (
  //     <div className="container mx-auto px-4 py-8">
  //       <div className="rounded-2xl border border-red-200/50 bg-red-500/10 p-6 dark:border-red-900/40 dark:bg-red-950/20">
  //         <h2 className="text-xl font-semibold text-red-700 dark:text-red-400">
  //           Access Denied
  //         </h2>
  //         <p className="mt-2 text-sm text-muted-foreground">
  //           You don't have permission to view analytics. Contact your administrator.
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList className="text-sm text-muted-foreground">
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/sales"
                className="rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
              >
                Sales
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator className="text-muted-foreground/40" />

            <BreadcrumbItem>
              <BreadcrumbPage className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
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