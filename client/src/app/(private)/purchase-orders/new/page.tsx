// app/purchase-orders/new/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import POForm  from "@/app/features/CreatePOModal"; // named import
import  PurchaseOrderForm, { PurchaseOrderFormPayload }  from "@/app/(components)/purchase-order/PurchaseOrderForm"
import { PurchaseOrderDTO, useCreatePurchaseOrderMutation } from "@/app/state/api";
import { toast } from "sonner";

export default function NewPOPage() {
  const router = useRouter();
  const [createPO, {isLoading}] = useCreatePurchaseOrderMutation();


  async function handleCreate(payload: PurchaseOrderFormPayload) {
    try {
      const { id: _ignored, ...body } = payload as PurchaseOrderDTO;

      await createPO(body).unwrap();
      toast.success("Purchase order created successfully");
      router.push("/purchases");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create purchase order")
    } 
  }


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/purchases"
            className="inline-flex items-center text-blue-600 hover:underline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Purchases
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            Create Purchase Order
          </h1>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-black/5">
          <PurchaseOrderForm
            mode="create"
            submitting={isLoading}
            onSubmit={handleCreate}
          />
        </div>
      </div>
    </div>
  );
}
