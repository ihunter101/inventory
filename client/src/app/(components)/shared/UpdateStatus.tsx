import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogContent,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

type UpdatePurchasesProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    isUpdating: boolean;
    source: "Purchase Order" | "Invoice" | "Goods Receipt";
    id: string;
}


export const UpdatePurchasesStatus = (
    {id,
    source,
    title,
    isUpdating,
    open,
    onOpenChange,
    onConfirm} : UpdatePurchasesProps,
) => {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-green-600">Update {title} Status</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to approve this {source}?
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                        <Button
                            variant="outline"
                            disabled={isUpdating}
                        >
                            Cancel
                        </Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Button
                            variant="default"
                            onClick={onConfirm}
                            disabled={isUpdating}
                        >
                            {isUpdating ? "Updating..." : "Update"}
                        </Button>
                    </AlertDialogAction> 
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}