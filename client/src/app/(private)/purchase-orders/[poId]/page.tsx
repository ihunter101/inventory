"use client"

import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner"
import PurchaseOrderForm, { PurchaseOrderFormPayload } from "@/app/(components)/purchase-order/PurchaseOrderForm";
import { PurchaseOrderDTO, useGetPurchaseOrderQuery, useUpdatePurchaseOrderMutation } from "@/app/state/api";



export default function EditPurchaseOrderPage (){

    const router = useRouter();
    const params = useParams<{poId: string}>();
    const poId = params.poId
    
    const { data: purchaseOrder, isLoading } = useGetPurchaseOrderQuery(poId)
    const [updatePurchaseOrder, {isLoading: isUpdating }] = useUpdatePurchaseOrderMutation()

    if (isLoading || !purchaseOrder) {
        return <div className="p-8">Loading...</div>
    }

    async function handleUpdate(payload: PurchaseOrderFormPayload){
        try {

            const {id: _ignored, ...rest} = payload as PurchaseOrderDTO;
            await updatePurchaseOrder({ id: poId, ...rest }).unwrap();
            toast.success("Purchase order updated successfully!");
            router.push("/purchases")
        } catch (error) {
            console.error(error);
            toast.error("Failed to update Purchase Order")
        }
    }
    return (
        <div className="mx-auto max-w-5xl p-8">
            <h1 className="mb-4 text-2xl font-semibold">Edit Purchase Order</h1>
            <PurchaseOrderForm
                mode={"edit"}
                initial={purchaseOrder}
                onSubmit={handleUpdate}
                submitting={isUpdating}
            />
        </div>
    )
}