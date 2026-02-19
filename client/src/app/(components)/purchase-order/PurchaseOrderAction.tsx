"use client"
import { ActionDropdown, type ActionItems } from "../shared/DropdownAction";
import { 
    PurchaseOrderDTO, 
    useDeletePurchaseOrderMutation, 
    useGetPurchaseOrderQuery, 
    useUpdatePurchaseOrderStatusMutation 
} from "@/app/state/api";
import { useResendPurchaseOrder } from "@/app/hooks/useResendPo";
import { useRouter } from "next/navigation"
import { useState } from "react";
import { toast } from "sonner";
import { DeleteDialogue } from "../shared/DeleteDialogue";
import { UpdatePurchasesStatus } from "../shared/UpdateStatus";
import { PurchaseOrderDownloadButton } from "../shared/OrderDownloadButton";
import { generatePDF, PurchaseOrderPDFData } from "../shared/PDFUtils";
import { useSendDocumentEmail } from "@/app/hooks/useSendDocumentEmail";

type PurchaseOrderProps = { purchaseOrder: PurchaseOrderDTO};

export function EditPurchaseOrder ({ purchaseOrder }: PurchaseOrderProps) {
    // 1. HOOKS and STATE (Always first)
    const router = useRouter(); // Initialize router here
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false);
    const { resendEmail, isLoading: isSendingEmail } = useResendPurchaseOrder();

    const [deletePurchaseOrder, {isLoading: isDeleting}] = useDeletePurchaseOrderMutation();
    const { data: orderNumber } = useGetPurchaseOrderQuery(purchaseOrder.id);
    const [updatePurchaseOrder, {isLoading: isUpdating}] = useUpdatePurchaseOrderStatusMutation();
    const { sendEmail, isLoading: isEmailing } = useSendDocumentEmail();
    // 2. DEPENDENT VALUES
    const title = orderNumber?.poNumber || "Unknown";
    
    // 3. HANDLER FUNCTIONS (Must be defined before they are used)
    const handleConfirmDelete = async () => {
        try {
            await deletePurchaseOrder({id: purchaseOrder.id}).unwrap();
            setIsDeleteDialogOpen(false);
            toast.success("Purchase Order deleted successfully");
            } catch (error) {
                console.error(error);   
                toast.error("Failed to delete purchase order");
            }
    };

    const handleUpdatePurchaseOrderStatus = async () => {
        try {
            await updatePurchaseOrder({id: purchaseOrder.id, status: "APPROVED"}).unwrap();
            setIsUpdateDialogOpen(false)
            toast.success("Purchase Order Status Updated Successfully")
        } catch (error) {
            console.error(error)
            toast.error("Failed to Update Purchase Order Status")
        }
    }

    // const handleEmailSupplier = async ()=> {
    //     const recipientEmail = purchaseOrder.supplier!.email
    //     try {
    //         await resendEmail(purchaseOrder.id, purchaseOrder.poNumber, recipientEmail)
    //         toast.success(`Purchase Order ${purchaseOrder.poNumber} successfully sent to ${recipientEmail}`)
    //     } catch (error) {
    //         toast.error(`Failed to send ${purchaseOrder.poNumber} to ${recipientEmail}`)
    //     }
        
    // }

    const handleEmailSupplier = async () => {
        const recipientEmail = purchaseOrder.supplier?.email;
        if (!recipientEmail) return toast.error("Supplier email not found");

        const toastId = toast.loading(`Sending ${title}...`)
        try {
            await sendEmail({
                docType: "purchase-order",
                docId: purchaseOrder.id,
                docNumber: purchaseOrder.poNumber,
                recipientEmail: recipientEmail,
            });
            toast.success(`Purchase Order ${title} successfully sent to ${recipientEmail}`, { id: toastId });
        } catch (error: any) {
            toast.error( error?.message ||`Failed to send ${title} to ${recipientEmail}`, { id: toastId });
        }
    }

    const handleDownloadPurchaseOrder = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    try {
        const data: PurchaseOrderPDFData = {
            documentType: "PO",
            title: "PURCHASE ORDER",
            documentNumber: purchaseOrder.poNumber,
            preparedBy: "Hunter", //TODO: ADD USER NAME LATER
            organizationName: "Laboratory Services and Consultation Limited",
            supplierName: purchaseOrder.supplier?.name ?? "N/A",
            expectedDeliveryDate: "N/A",
            items: purchaseOrder.items.map((item) => ({
                name: item.name,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
                unit: item.unit,
            total: Number(item.quantity) * Number(item.unitPrice),
            })),
        };

        generatePDF(data);
        toast.success("Download started");
    } catch (err) {
        console.error("PDF generation failed:", err);
        toast.error("Failed to generate PDF");
    } finally {
        setIsDownloading(false);
    }
    };
    // 4. ACTION ITEMS
    const items: ActionItems[] = [
        {
            label: "Edit Order",
            onSelect: ()=> {
                router.push(`/purchase-orders/${purchaseOrder.id}`);
            },
            variant: "normal"
        }, 
        {
            label: "View Order Details",
            onSelect: () => {
                router.push(`/purchase-orders/view/${purchaseOrder.id}`)
            },
            variant: "normal"
        },
        {
            label: "Update Status",
            onSelect: () => {
                setIsUpdateDialogOpen(true)
            },
            variant: "normal",

        },
        {
            label: isSendingEmail ? "Emailing Supplier" : "Email Supplier",
            onSelect: handleEmailSupplier,
            variant: "normal"
        },
        {
            label: "Download Order",
            onSelect: handleDownloadPurchaseOrder,
            variant: "normal",
            disabled: isDownloading,
        },
        {
            label: "Delete Order",
            // 💡 CRITICAL: This must open the dialog, not run the delete logic
            onSelect: () => {
                setIsDeleteDialogOpen(true); // 👈 Set state to true to open dialog
            },
            variant: "danger",
            disabled: isDeleting, // Optionally disable while loading
        },
        ];

    // 5. RETURN JSX (Finally)
    return (
        <>
            <ActionDropdown items={items} />

            <DeleteDialogue 
                title={title}
                source="Purchase Order"
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleConfirmDelete} // Pass the confirmed handler
                isDeleting={isDeleting}
                id={purchaseOrder.id}
            />
            
            <UpdatePurchasesStatus 
                title={title}
                source="Purchase Order"
                open={isUpdateDialogOpen}
                onOpenChange={setIsUpdateDialogOpen}
                onConfirm={handleUpdatePurchaseOrderStatus}
                isUpdating={isUpdating}
                id={purchaseOrder.id}
            />

            {/* <EmailSupplier /> */}

            {/* <DownloadPurchaseOrder /> */}
        </>
    );
} 