import { Suspense } from "react";
import InvoiceFormSkeleton from "@/app/features/components/InvoiceFormSkeleton";
import  InvoiceForm  from "../../../features/components/InvoiceForm";

export default function NewInvoicePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink-900">
          Create Supplier Invoice
        </h1>
        <p className="text-ink-400">
          Search a Purchase Order by its number; we’ll grab the supplier and you
          can refine the lines.
        </p>
      </div>

      <Suspense fallback={<InvoiceFormSkeleton />}>
        <InvoiceForm />
      </Suspense>
    </div>
  );
}
