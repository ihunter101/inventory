"use client"

import  { ActionDropdown, type ActionItems } from "@/app/(components)/shared/DropdownAction"
import { GoodsReceiptDTO, SupplierInvoiceDTO, useCreateGRNMutation, useDeleteSupplierInvoiceMutation, useGetSupplierInvoiceQuery, useMarkInvoicePaidMutation, useUpdatePurchaseOrderStatusMutation } from "@/app/state/api"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { UpdatePurchasesStatus } from "../shared/UpdateStatus"
import { toast } from "sonner"
import { DeleteDialogue } from "../shared/DeleteDialogue"
import { CreateGRNDialog } from "@/app/features/components/createGRModal"

type SupplierInvoiceProps = { 
  supplierInvoice: SupplierInvoiceDTO;
  goodsReceipt: GoodsReceiptDTO[];
  onCreateGRN: (invoice: SupplierInvoiceDTO) => void
}

export const InvoiceActions = ({
  supplierInvoice,
  goodsReceipt,
  onCreateGRN,
}: SupplierInvoiceProps) => {
  
  const router = useRouter();

  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isGoodsReceiptDialogOpen, setIsGoodsReceiptDialogOpen] = useState(false);

  //const [editingInvoice, isEditingInvoice ] = useState(false);
  const {data: invoice, isLoading: isEditing} = useGetSupplierInvoiceQuery(supplierInvoice.id)
  const [updateInvoiceStatus, {isLoading: isUpdating}] = useMarkInvoicePaidMutation();
  const [deleteInvoice, {isLoading: isDeleting}] = useDeleteSupplierInvoiceMutation();

  const title = supplierInvoice.invoiceNumber || "Unknown";

  const hasGoodsReceipt = (supplierInvoice: SupplierInvoiceDTO) => 
    goodsReceipt.some((g) => g.poId === supplierInvoice.poId && g.invoiceId === supplierInvoice.id)


  const handleUpdateInvoiceStatus = async () => {
    try {
      await updateInvoiceStatus({id: supplierInvoice.id}).unwrap();
      setIsUpdateDialogOpen(false);
      toast.success("Invoice status updated sucessfully");
    } catch (error) {
      console.error(error)
      toast.error("Failed to update invoice status");
    }
  }

  const handleDeleteInvoice = async () => {
    try {
    await deleteInvoice({id: supplierInvoice.id}).unwrap();
    setIsDeleteDialogOpen(false)
    toast.success("Invoice Deleted successfully");
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete invoice");
    }
  }

  // const handleGRNSuccess = (grnId: string) => {
  //   toast.success("Goods Receipt successfully created");
  //   router.refresh()
  // }
  

  const handleDownloadInvoice = async () => {

  }

  const items: ActionItems[] = [
    {
      label: "Edit Invoice",
      onSelect: () => {
        router.push(`/invoices/${supplierInvoice.id}`)
      },
      variant: "normal",
    },
    {
      label: "Download Invoice",
      onSelect: handleDownloadInvoice,
      variant: "normal",
      disabled: isDownloading,
    },
    {
      label: "Update Status",
      onSelect: () => setIsUpdateDialogOpen(true),
      variant: "normal",
    },
    {
      label: "Create Goods Receipt",
      onSelect: () => onCreateGRN(supplierInvoice),
      variant: "normal",
      disabled: hasGoodsReceipt(supplierInvoice)
    },
    {
      label: "Delete Invoice",
      onSelect: () => setIsDeleteDialogOpen(true),
      variant: "danger",
      disabled: isDeleting
    },
  ]

  return (
    <>
    <ActionDropdown items={items}/>

    <UpdatePurchasesStatus 
      title={title}
      source="Invoice"
      open={isUpdateDialogOpen}
      onOpenChange={setIsUpdateDialogOpen}
      onConfirm={handleUpdateInvoiceStatus}
      isUpdating={isUpdating}
      id={supplierInvoice.id}
    />
      {/* <CreateGRNDialog 
      open={isGoodsReceiptDialogOpen}
      onOpenChange={setIsGoodsReceiptDialogOpen}
      invoice={supplierInvoice}
      onSuccess={handleGRNSuccess}
      /> */}

    <DeleteDialogue 
      title={title}
      source="Invoice"
      open={isDeleteDialogOpen}
      onOpenChange={setIsDeleteDialogOpen}
      onConfirm={handleDeleteInvoice}
      isDeleting={isDeleting}
      id={supplierInvoice.id}
    />


    </>

  )
}