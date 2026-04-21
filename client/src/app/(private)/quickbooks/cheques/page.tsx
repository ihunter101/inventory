import QuickbooksChequeTable from "@/app/(components)/quickbooks/QuickbooksChequeTable";

export default function QuickBooksChequesPage() {
  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cheques Paid</h1>
        <p className="text-sm text-muted-foreground">
          Cheque payments synced from QuickBooks Desktop.
        </p>
      </div>

      <QuickbooksChequeTable />
    </main>
  );
}