import QuickbooksPaymentTable from "@/app/(components)/quickbooks/QuickbooksPaymentTable";

export default function QuickBooksPaymentsPage() {
  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments Received</h1>
        <p className="text-sm text-muted-foreground">
          Customer payments synced from QuickBooks Desktop.
        </p>
      </div>

      <QuickbooksPaymentTable />
    </main>
  );
}