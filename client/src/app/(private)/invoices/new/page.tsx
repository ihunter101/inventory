"use client"
import { Suspense } from "react";
import InvoiceFormSkeleton from "@/app/features/components/InvoiceFormSkeleton";
import  InvoiceForm, { SupplierInvoiceFormPayload }  from "../../../features/components/InvoiceForm";
import { useRouter } from "next/navigation"
import { SupplierInvoiceDTO, useCreateSupplierInvoiceMutation, useGetPurchaseOrderQuery } from "@/app/state/api";
import { toast } from "sonner";

export default function NewInvoicePage() {
    const router = useRouter();


    const [createSupplierInvoice, {isLoading: isCreating}] = useCreateSupplierInvoiceMutation();

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
    
            <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-black/5">
                      <InvoiceForm
                        mode="create"
                        onSubmit={handleCreateInvoice}
                        submitting={isCreating}
                        onSuccess={() => {
                          router.push("/purchases"); // return to the tabbed list
                        }}
                      />
                    </div>
        
      </Suspense>
    </div>
  );
}
