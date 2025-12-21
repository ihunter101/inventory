import { MoreHorizontal, Edit, Trash2, CheckCircle, Mail, Download, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import React from "react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    "Edit Order": Edit,
    "Edit Invoice": Edit,
    "Edit Goods Receipt": Edit,
    "Delete Order": Trash2,
    "Delete Invoice": Trash2,
    "Delete Goods Receipt": Trash2,
    "Update Status": CheckCircle,
    "Email Supplier": Mail,
    "Download Order": Download,
    "Download Invoice": Download,
    "Download Goods Receipt": Download,
    "Create Goods Receipt": ClipboardCheck,
};

export type ActionItems = {
    label: string;
    onSelect: () => void;
    variant?: "normal" | "danger";
    disabled?: boolean;
}

type ItemProps = {
    items: ActionItems[];
}

export function ActionDropdown({ items }: ItemProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent 
                align="end" 
                className="w-[240px] bg-white border border-gray-200"
                style={{ backgroundColor: 'white' }}
            >
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200" />
                
                {items.map((item, index) => {
                    const Icon = iconMap[item.label];
                    const isDanger = item.variant === "danger";
                    const needsSeparator = isDanger && index > 0;

                    return (
                        <React.Fragment key={index}>
                            {needsSeparator && (
                                <DropdownMenuSeparator className="bg-gray-200" />
                            )}
                            <DropdownMenuItem
                                onClick={item.onSelect}
                                disabled={item.disabled}
                                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-all duration-150
                                    ${isDanger 
                                        ? "text-red-600 hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700 active:scale-[0.98]" 
                                        : "text-gray-700 hover:bg-gray-100 focus:bg-gray-100 active:scale-[0.98]"
                                    }
                                    ${item.disabled ? "opacity-40 cursor-not-allowed" : ""}
                                `}
                            >
                                {Icon && (
                                    <div className={`flex items-center justify-center w-6 h-6 rounded-lg
                                        ${isDanger ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}
                                    `}>
                                        <Icon className="h-4 w-4 shrink-0" />
                                    </div>
                                )}
                                <span className="flex-1">{item.label}</span>
                            </DropdownMenuItem>
                        </React.Fragment>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}