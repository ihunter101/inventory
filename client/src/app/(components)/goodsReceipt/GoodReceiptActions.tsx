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
import { useSendDocumentEmail } from "@/app/hooks/useSendDocumentEmail";
import { generateGoodsReceiptPDF, GoodsReceiptPDFData } from "../shared/GRNUtils";
import { generatePDF } from "../shared/PDFUtils";

type GoodsReceiptProps = { 
  goodsReceipt: GoodsReceiptDTO;
  orders: PurchaseOrderDTO[];
  invoices: SupplierInvoiceDTO[];
  onPost: (grnId: string) => void; 
  isDeleting: boolean;
  isPosting: boolean;
}

export function GoodsReceiptAction({
  goodsReceipt,
  orders, 
  invoices,
  onPost,
  isDeleting,
  isPosting,
}: GoodsReceiptProps){
  const router = useRouter()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const [deleteGoodsReceipt] = useDeleteGoodsReceiptMutation();
  const [postGoodsReceipt, { isLoading: isPostingMutation }] = usePostGRNMutation();
  const [updateGoodsReceipt, { isLoading: isUpdating }] = useUpdateGRNMutation();
  const { data: goodsReceiptNote, isLoading } = useGetGoodsReceiptQuery(
    goodsReceipt.id, 
    { skip: !isEditDialogOpen }
  );
  const {sendEmail, isLoading: isEmailing} = useSendDocumentEmail();

  const title = goodsReceipt.grnNumber || "unknown"

  const matchedPurchaseOrder = orders.find((po) => po.id === goodsReceipt.poId);
  const matchedInvoice = invoices.find((inv) => inv.id === goodsReceipt.invoiceId);
  const hasFullMatch = !!matchedPurchaseOrder && !!matchedInvoice;

  const recipientEmail = matchedPurchaseOrder?.supplier?.email
  if (!recipientEmail) return toast.error("Supplier email not found");

  const canPost = goodsReceipt.status === "DRAFT";

  const handleDelete = async () => {
    const toastId = toast.loading(`Deleting ${title}...`)
    try {
      await deleteGoodsReceipt({ id: goodsReceipt.id }).unwrap();
      setIsDeleteDialogOpen(false)
      toast.success("Goods Receipt deleted successfully", { id: toastId });
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Failed to delete goods receipt", { id: toastId });
    }
  };

  const handleEmailGoodsReceipt = async () => {
    const toastId = toast.loading(`Emailing ${title}...`)

    try {
      await sendEmail({
        docType: "goods-receipt",
        docId: goodsReceipt.id,
        docNumber: goodsReceipt.grnNumber,
        recipientEmail,
      })
      toast.success(`Successfully emailed ${title}, to ${recipientEmail},`, { id: toastId})
    } catch (error: any) {
      toast.error(error?.message || `Failed to email ${title} to ${recipientEmail}`, { id: toastId })
    }
  }

  async function handlePostGRN() {
    const toastId = toast.loading(`Posting ${title}...`);
    try {
      const result = await postGoodsReceipt({ id: goodsReceipt.id }).unwrap();
      console.log("Post GRN result:", result);
      
      toast.success(`Successfully posted ${title}`, { id: toastId });
      
      // Call the parent's onPost callback if provided
      if (onPost && result.grnId) {
        onPost(result.grnId);
      }
    } catch (error: any) {
      console.error("Post GRN error:", error);
      
      // Better error message extraction
      const errorMessage = error?.data?.message 
        || error?.message 
        || "Failed to post goods receipt";
      
      toast.error(errorMessage, { id: toastId });
    }
  }

  const handleEditGoodsReceipt = async () => {
    // Implement edit logic
  };

  const handleDownloadGoodsReceipt = async () => {
  if (isDownloading) return;
  setIsDownloading(true);

  try {
    const data: GoodsReceiptPDFData = {
      documentType: "GRN",
      title: "GOODS RECEIPT",
      documentNumber: goodsReceipt.grnNumber,
      preparedBy: "Hunter",
      receivedBy: "Hunter",
      organizationName: "Laboratory Services and Consultation Limited",
      supplierName: matchedPurchaseOrder?.supplier?.name ?? "Supplier",
      supplierEmail: matchedPurchaseOrder?.supplier?.email,
      receiptDate: new Date().toLocaleDateString(),
      purchaseOrderNumber:
        goodsReceipt.poNumber ?? (goodsReceipt as any).po?.poNumber ?? "N/A",
      notes: goodsReceipt.notes,

      items: goodsReceipt.lines.map((line) => ({
        name:
          (line as any).name ??
          (line as any).product?.name ??
          (line as any).draftProduct?.name ??
          (line as any).poItem?.name ??
          "Unknown item",

        orderedQty:
          (line as any).orderedQty ??
          (line as any).orderedQuantity ??
          (line as any).poQty ??
          0,

        receivedQty: Number((line as any).receivedQty ?? 0),
        unit: (line as any).unit ?? (line as any).product?.unit ?? "pcs",
        unitPrice: Number((line as any).unitPrice ?? 0),
        total: Number((line as any).total ?? 0),
      })),
    };

    // IMPORTANT if your generator is async:
    await generateGoodsReceiptPDF(data);

    toast.success("Goods Receipt successfully downloaded");
  } catch (error) {
    console.error("PDF generation failed", error);
    toast.error("Failed to generate PDF");
  } finally {
    setIsDownloading(false);
  }
};


  const items: ActionItems[] = [
    {
      label: "Post Goods Receipt",
      onSelect: handlePostGRN,
      variant: "normal",
      disabled: !canPost || isPostingMutation,
    },
    {
      label: "Edit Goods Receipt",
      onSelect: () => setIsEditDialogOpen(true),
      variant: "normal",
      disabled: goodsReceipt.status !== "DRAFT",
    },
    {
      label: "Email Supplier",
      onSelect: handleEmailGoodsReceipt,
      variant: "normal",
    },
    {
      label: "Download Goods Receipt",
      onSelect: handleDownloadGoodsReceipt,
      variant: "normal",
    },
    {
      label: "Delete Goods Receipt",
      onSelect: () => setIsDeleteDialogOpen(true),
      variant: "danger",
      disabled: goodsReceipt.status !== "DRAFT",
    }
  ]

  return (
    <>
      <ActionDropdown items={items} />
      
      <DeleteDialogue
        title={title}
        source="Goods Receipt"
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        id={goodsReceipt.id}
      />
      
      <UpdatePurchasesStatus 
        title={title}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onConfirm={handleEditGoodsReceipt}
        id={goodsReceipt.id}
        isUpdating={isUpdating}
        source="Goods Receipt"
      />
    </>
  )
}