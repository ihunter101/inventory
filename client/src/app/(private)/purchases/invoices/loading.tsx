import InvoiceFormSkeleton from "../../../features/components/InvoiceFormSkeleton";

export default function LoadingNewInvoice() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6">
        <div className="h-7 w-64 rounded bg-muted animate-pulse" />
        <div className="mt-2 h-4 w-96 rounded bg-muted animate-pulse" />
      </div>
      <InvoiceFormSkeleton />
    </div>
  );
}
