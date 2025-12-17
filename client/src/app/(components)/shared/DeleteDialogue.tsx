import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogTitle,
    AlertDialogTrigger,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";


type DeleteDialogueProps = {
    title: string;
    source: "Purchase Order" | "Invoice" | "Goods Receipt";
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isDeleting: boolean;
    id: string;
}
export function DeleteDialogue({
    title,
    source,
    open,
    onOpenChange,
    onConfirm,
    isDeleting,
    id
} : DeleteDialogueProps) {

    return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle className="text-red-600">
                    Delete {title}?
                </AlertDialogTitle>

                <AlertDialogDescription>
                    Deleting this {source} will permanently remove it from the system.
                </AlertDialogDescription>

            </AlertDialogHeader>

            <AlertDialogFooter>
                <AlertDialogCancel asChild>
                    <Button
                        variant="outline"
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                </AlertDialogCancel>

                <AlertDialogAction asChild>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
        
    </AlertDialog>
)}