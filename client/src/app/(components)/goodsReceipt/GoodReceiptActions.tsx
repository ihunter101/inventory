"use client"

import { 
  GoodsReceiptDTO, 
  useDeleteGoodsReceiptMutation, 
  useGetGoodsReceiptQuery, 
  usePostGRNMutation, 
  useUpdateGRNMutation,
  PurchaseOrderDTO,
  SupplierInvoiceDTO
} from "@/app/state/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ActionDropdown, ActionItems } from "../shared/DropdownAction";
import { DeleteDialogue } from "../shared/DeleteDialogue";
import { UpdatePurchasesStatus } from "../shared/UpdateStatus";
import { toast } from "sonner";

type GoodsReceiptProps = { 
  goodsReceipt: GoodsReceiptDTO;
  orders: PurchaseOrderDTO[];
  invoices: SupplierInvoiceDTO[];
  onPost: (grnId: string) => void; 
  // onDelete: (grnId: string) => void;
  //onEdit: (grn: string) => void;
  isDeleting: boolean;
  isPosting: boolean;

}

export function GoodsReceiptAction({
  goodsReceipt,
  orders, 
  invoices,
  onPost,
  //onDelete,
  //onEdit,
  isDeleting,
  isPosting,
}: GoodsReceiptProps){
  const router = useRouter()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const [deleteGoodsReceipt] = useDeleteGoodsReceiptMutation();
  const [postGoodsReceipt, {isLoading: i}]  = usePostGRNMutation();
  const [updateGoodsReceipt, {isLoading: isUpdating}] = useUpdateGRNMutation();
  const {data: goodsReceiptNote, isLoading} = useGetGoodsReceiptQuery(goodsReceipt.id, { skip: !open });

  const title = goodsReceipt.grnNumber || "unknown"

  const matchedPurchaseOrder = orders.find((po) => po.id === goodsReceipt.poId);
  const matchedInvoice = invoices.find((inv) => inv.id === goodsReceipt.invoiceId);
  const hasFullMatch = !!matchedPurchaseOrder && matchedInvoice;

  const canPost = goodsReceipt.status === "DRAFT" && onPost;
  //const canEdit = goodsReceipt.status === "DRAFT" && onEdit;
  //const canDelete = goodsReceipt.status === "DRAFT" && onDelete;


  const handleDelete = async () => {
    const toastId = toast.loading(`deleting ${title}`)
    try {
        await deleteGoodsReceipt({id: goodsReceipt.id}).unwrap();
        setIsDeleteDialogOpen(false)
        toast.success("Invoice Deleted successfully", {id: toastId});
        } catch (error) {
          console.error(error)
          toast.error("Failed to delete invoice", {id: toastId});
        }
  };

  

  async function handlePostGRN() {
  const toastId = toast.loading(`Posting ${title}...`);
  try {
    const payload = await postGoodsReceipt({ id: goodsReceipt.id }).unwrap();
    console.log("fulfilled:", payload);
    toast.success(`Successfully posted ${title}`, { id: toastId });
  } catch (error) {
    console.error(error);
    toast.error(`Failed to post ${title}`, { id: toastId });
  }
}

  const handleEditGoodsReceipt = async () => {
    
  };

  const items: ActionItems[] = [
    {
      label: "Post Goods Receipt",
      onSelect: handlePostGRN,
      variant: "normal",
    },
    {
      label: "Edit Goods Receipt",
      onSelect: () => {},
      variant: "normal",
    },
    {
      label: "Email Supplier",
      onSelect: () => {},
      variant: "normal",
    },
    {
      label: "Download Goods Receipt",
      onSelect: () => {},
      variant: "normal",
    },
    {
      label: "Delete Goods Receipt",
      onSelect: handleDelete,
      variant: "danger",
    }
  ]

  return (
    <>
    <ActionDropdown  items={items} />
    <DeleteDialogue
      title={title}
      source="Goods Receipt"
      open={isDeleteDialogOpen}
      onOpenChange={setIsDeleteDialogOpen}
      onConfirm={handleDelete}
      isDeleting={isDeleteDialogOpen}
      id={goodsReceipt.id}
    />
    <UpdatePurchasesStatus 
    title={title}
    open={isEditDialogOpen}
    onOpenChange={setIsEditDialogOpen}
    onConfirm={handleEditGoodsReceipt}
    id={goodsReceipt.id}
    isUpdating={isEditDialogOpen}
    source="Goods Receipt"
    />

    </>
  )
}