"use client";

import { useParams } from "next/navigation";
import { useGetSuppliersAnalyticsQuery } from "@/app/state/api";
import { Skeleton } from "@/components/ui/skeleton";

import { OverdueBanner } from "@/app/(components)/supplier/OverdueBanner";
import { SupplierHeader } from "@/app/(components)/supplier/SupplierIdHeader";
import { SupplierKpiCards } from "@/app/(components)/supplier/SupplierKpiCards";
import { RecentInvoicesTable } from "@/app/(components)/supplier/RecentInvoicesTable";
import { InvoiceStatusBreakdown } from "@/app/(components)/supplier/InvoiceStatusBreakdown";
import { OverdueInvoicesTable } from "@/app/(components)/supplier/OverdueInvoicesTable";


export default function SupplierDetailsPage() {
  const params = useParams();
  const supplierId =
    typeof params.supplierId === "string" ? params.supplierId : "";

  const { data, isLoading, isError } = useGetSuppliersAnalyticsQuery(
    supplierId,
    { skip: !supplierId }
  );

  if (isLoading) return <SupplierPageSkeleton />;

  if (isError || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Failed to load supplier analytics.
        </p>
      </div>
    );
  }

  const { supplier, kpis, recentInvoices, invoiceStatusBreakdown, overdueInvoices } = data;

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-7 sm:px-6 lg:px-8">
      <SupplierHeader supplier={supplier} overdueCount={kpis.overdueInvoiceCount} />

      <OverdueBanner
        overdueCount={kpis.overdueInvoiceCount}
        totalOwed={kpis.totalOwed}
      />

      <SupplierKpiCards kpis={kpis} />

      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
        <RecentInvoicesTable invoices={recentInvoices} />
        <InvoiceStatusBreakdown
          breakdown={invoiceStatusBreakdown}
          totalInvoiceAmount={kpis.totalInvoiceAmount}
        />
      </div>

      <OverdueInvoicesTable invoices={overdueInvoices} />
    </main>
  );
}

function SupplierPageSkeleton() {
  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-7 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3.5 w-64" />
        </div>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
      </div>
      <div className="grid gap-2.5 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-52 rounded-xl" />
      </div>
      <Skeleton className="h-44 rounded-xl" />
    </main>
  );
}
