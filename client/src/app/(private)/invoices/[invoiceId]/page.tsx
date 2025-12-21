"use client";

import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  SupplierInvoiceDTO,
  useGetSupplierInvoiceQuery,
  useUpdateSupplierInvoiceMutation,
  useGetPurchaseOrderQuery,     // ✅ add this
} from "@/app/state/api";

import InvoiceForm, { SupplierInvoiceFormPayload } from "@/app/features/components/InvoiceForm";

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams<{ invoiceId: string }>();
  const id = params.invoiceId;

  const { data: supplierInvoice, isLoading, isError, error, isFetching, isSuccess } =
    useGetSupplierInvoiceQuery(id, { skip: !id });

  // fetch linked PO once invoice is available
  const poId = supplierInvoice?.poId;

const { data: linkedPO, isFetching: poFetching } =
  useGetPurchaseOrderQuery(poId ?? "", { skip: !poId });


  const [updateSupplierInvoice, { isLoading: isUpdating }] =
    useUpdateSupplierInvoiceMutation();

  if (isLoading || isFetching || poFetching) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-slate-700">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading invoice…</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return <div className="p-6 text-red-600">Failed to load invoice.</div>;
  }

  if (!supplierInvoice && isSuccess) {
    return <div className="p-6">Invoice not found.</div>;
  }

  if (error) {
    // optional: you can still allow edit if PO fails, but display a warning
    console.warn("Failed to load linked PO");
  }

  const handleUpdateInvoice = async (payload: SupplierInvoiceFormPayload) => {
    try {
      const { id: ignored, ...updateData } = payload as SupplierInvoiceDTO;

      await updateSupplierInvoice({
        id,
        ...updateData,
      }).unwrap()
      .then((payload) => (console.log("fullfilled", payload)))
      .catch((error) => console.log("rejected", error));

      // if (!results?.invoice?.id){
      //   throw new Error(results?.message || "Update failed")
      // }

      toast.success("Invoice updated successfully");
      router.push("/purchases?tab=invoices");

    } catch (error) {
      toast.error("Failed to update invoice");
      throw error;
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-8">
      <InvoiceForm
        mode="edit"
        initial={supplierInvoice}
        linkedPO={linkedPO}   // ✅ pass it down
        onSubmit={handleUpdateInvoice}
        submitting={isUpdating}
      />
    </div>
  );
}
