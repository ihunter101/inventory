"use client";

import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import PurchaseOrderForm, {
  PurchaseOrderFormPayload,
} from "@/app/(components)/purchase-order/PurchaseOrderForm";
import {
  PurchaseOrderDTO,
  useGetPurchaseOrderQuery,
  useUpdatePurchaseOrderMutation,
} from "@/app/state/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function EditPurchaseOrderPage() {
  const router = useRouter();
  const params = useParams<{ poId: string }>();
  const poId = params.poId;

  const { data: purchaseOrder, isLoading } = useGetPurchaseOrderQuery(poId);
  const [updatePurchaseOrder, { isLoading: isUpdating }] =
    useUpdatePurchaseOrderMutation();

  if (isLoading || !purchaseOrder) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:min-h-[260px]">
          <p className="text-center text-sm text-muted-foreground sm:text-base">
            Loading purchase order...
          </p>
        </div>
      </div>
    );
  }

  async function handleUpdate(payload: PurchaseOrderFormPayload) {
    try {
      const { id: _ignored, ...rest } = payload as PurchaseOrderDTO;
      await updatePurchaseOrder({ id: poId, ...rest }).unwrap();
      toast.success("Purchase order updated successfully!");
      router.push("/purchases");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update Purchase Order");
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <Card className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <CardHeader className="border-b border-border/60 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <CardTitle className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Edit Purchase Order
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground sm:text-base">
            Update supplier, line items, quantities, and other purchase order details.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="w-full overflow-x-hidden">
            <PurchaseOrderForm
              mode="edit"
              initial={purchaseOrder}
              onSubmit={handleUpdate}
              submitting={isUpdating}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}