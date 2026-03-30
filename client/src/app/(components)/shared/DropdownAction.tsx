import { MoreHorizontal, Edit, Trash2, CheckCircle, Mail, Download, ClipboardCheck, ViewIcon } from "lucide-react";
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
  "View Order Details": ViewIcon,
};

export type ActionItems = {
  label: string;
  onSelect: () => void;
  variant?: "normal" | "danger";
  disabled?: boolean;
};

type ItemProps = {
  items: ActionItems[];
};

export function ActionDropdown({ items }: ItemProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[240px] rounded-xl border border-border/60 bg-popover p-1.5 shadow-xl"
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Actions
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-border/60" />

        {items.map((item, index) => {
          const Icon = iconMap[item.label];
          const isDanger = item.variant === "danger";
          const needsSeparator = isDanger && index > 0;

          return (
            <React.Fragment key={index}>
              {needsSeparator && (
                <DropdownMenuSeparator className="bg-border/60" />
              )}

              <DropdownMenuItem
                onClick={item.onSelect}
                disabled={item.disabled}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 focus:outline-none
                  ${
                    isDanger
                      ? "text-red-600 hover:bg-red-500/10 hover:text-red-700 focus:bg-red-500/10 focus:text-red-700 dark:text-red-400 dark:hover:text-red-400 dark:focus:text-red-400"
                      : "text-foreground hover:bg-muted/50 focus:bg-muted/50"
                  }
                  ${item.disabled ? "cursor-not-allowed opacity-40" : ""}
                `}
              >
                {Icon && (
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border
                      ${
                        isDanger
                          ? "border-red-200/50 bg-red-500/10 text-red-600 dark:border-red-900/40 dark:text-red-400"
                          : "border-border/60 bg-muted/40 text-muted-foreground"
                      }
                    `}
                  >
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