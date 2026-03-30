// client/src/app/(private)/invoices/new/page.tsx
"use client";

import { Suspense } from "react";
import InvoiceFormSkeleton from "@/app/features/components/InvoiceFormSkeleton";
import InvoiceForm, {
  SupplierInvoiceFormPayload,
} from "../../../features/components/InvoiceForm";
import { useRouter } from "next/navigation";
import { useCreateSupplierInvoiceMutation } from "@/app/state/api";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewInvoicePage() {
  const router = useRouter();

  const [createSupplierInvoice, { isLoading: isCreating }] =
    useCreateSupplierInvoiceMutation();

  const handleCreateInvoice = async (payload: SupplierInvoiceFormPayload) => {
    try {
      const created = await createSupplierInvoice(payload).unwrap();

      toast.success("Invoice successfully created", {
        description: created.invoiceNumber,
      });

      router.push("/purchases?tab=invoices");
    } catch (error: any) {
      console.error("Create invoice failed:", error);

      toast.error(
        error?.data?.message ||
          error?.error ||
          error?.message ||
          "Failed to create invoice"
      );

      // ✅ IMPORTANT: rethrow so InvoiceForm knows it failed
      throw error;
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mb-6 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-5">
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            Search a Purchase Order by its number; we’ll grab the supplier and you
            can refine the lines.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/purchases"
            className="inline-flex items-center text-sm font-medium text-primary transition-colors hover:underline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Purchases
          </Link>

          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Create Supplier Invoice
          </h1>
        </div>
      </div>

      <Suspense fallback={<InvoiceFormSkeleton />}>
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
            <InvoiceForm
              mode="create"
              onSubmit={handleCreateInvoice}
              submitting={isCreating}
              onSuccess={() => {
                router.push("/purchases"); // return to the tabbed list
              }}
            />
          </div>
        </div>
      </Suspense>
    </div>
  );
}