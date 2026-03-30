// app/purchase-orders/new/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import PurchaseOrderForm, {
  PurchaseOrderFormPayload,
} from "@/app/(components)/purchase-order/PurchaseOrderForm";
import { PurchaseOrderDTO, useCreatePurchaseOrderMutation } from "@/app/state/api";
import { toast } from "sonner";

export default function NewPOPage() {
  const router = useRouter();
  const [createPO, { isLoading }] = useCreatePurchaseOrderMutation();

  async function handleCreate(payload: PurchaseOrderFormPayload) {
    try {
      const { id: _ignored, ...body } = payload as PurchaseOrderDTO;

      await createPO(body).unwrap();
      toast.success("Purchase order created successfully");
      router.push("/purchases");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create purchase order");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-6 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/purchases"
              className="inline-flex items-center text-sm font-medium text-primary transition-colors hover:underline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Purchases
            </Link>

            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Create Purchase Order
              </h1>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
            <PurchaseOrderForm
              mode="create"
              submitting={isLoading}
              onSubmit={handleCreate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}