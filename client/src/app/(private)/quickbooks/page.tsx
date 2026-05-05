import QuickbooksSyncStatus from "@/app/(components)/quickbooks/QuickbooksSyncStatus";
import QuickbooksInvoiceTable from "@/app/(components)/quickbooks/QuickbooksInvoiceTable";
import QuickbooksPaymentTable from "@/app/(components)/quickbooks/QuickbooksPaymentTable";
import QuickbooksChequeTable from "@/app/(components)/quickbooks/QuickbooksChequeTable";
import QuickbooksCustomerTable from "@/app/(components)/quickbooks/QuickbooksCustomerTable";

export default function QuickBooksPage() {
  return (
    <main className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">QuickBooks Finance</h1>
        <p className="text-sm text-muted-foreground">
          Synced customer invoices, payments received, and cheques from QuickBooks Desktop.
        </p>
      </div>

      <QuickbooksSyncStatus />

      <QuickbooksCustomerTable />

      <QuickbooksInvoiceTable />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <QuickbooksPaymentTable />
        <QuickbooksChequeTable />
      </div>
    </main>
  );
}
