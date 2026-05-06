"use client";

import BatchMarkInvoicesPaidForm from "@/app/(components)/quickbooks/BatchMarkInvoicesPaidForm";
import QuickBooksPaymentSyncJobsTable from "@/app/(components)/quickbooks/QuickBooksPaymentSyncJobsTable";

export default function QuickBooksPaymentSyncPage() {
  return (
    <main className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">QuickBooks Payment Sync</h1>
        <p className="text-sm text-zinc-500">
          Queue customer invoice payments from your app to QuickBooks Desktop.
        </p>
      </div>

      <BatchMarkInvoicesPaidForm />

      <QuickBooksPaymentSyncJobsTable />
    </main>
  );
}