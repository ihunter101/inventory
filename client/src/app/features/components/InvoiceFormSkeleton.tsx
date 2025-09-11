export default function InvoiceFormSkeleton() {
  return (
    <div className="space-y-4 rounded-xl border bg-white p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-10 rounded bg-muted animate-pulse" />
        <div className="h-10 rounded bg-muted animate-pulse" />
      </div>
      <div className="h-10 rounded bg-muted animate-pulse" />
      <div className="h-64 rounded bg-muted animate-pulse" />
      <div className="flex justify-end">
        <div className="h-10 w-40 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}
