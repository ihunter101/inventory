import QuickbooksInvoiceTable from "@/app/(components)/quickbooks/QuickbooksInvoiceTable";

export default function QuickBooksInvoicesPage() {
  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">QuickBooks Invoices</h1>
        <p className="text-sm text-muted-foreground">
          Customer invoices synced from QuickBooks Desktop.
        </p>
      </div>

      <QuickbooksInvoiceTable />
    </main>
  );
}