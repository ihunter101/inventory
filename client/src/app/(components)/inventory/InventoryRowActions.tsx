"use client";

import * as React from "react";

import type { InventoryRow } from "./InventoryTypes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Minus,
  Plus,
  ClipboardList
} from 'lucide-react';
import { Button } from "@/components/ui/button";

type InventoryRowProps = {
  row: InventoryRow;

  adjusting: boolean;
  setting: boolean;

  onQuickAdjust: (row: InventoryRow, delta: number, reason?: string) => void;
  onOpenStocktake: (row: InventoryRow) => void;

  onView?: (row: InventoryRow) => void;
  onEdit?: (row: InventoryRow) => void
}

export function InventoryAction({
  row,
  adjusting,
  setting,
  onQuickAdjust,
  onOpenStocktake,
  onView,
  onEdit,
}: InventoryRowProps){

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-accent transition-colors"
          aria-label="Open actions"
        >
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        className="z-50 w-64 rounded-lg shadow-lg border-border/50"
        align="end"
        sideOffset={8}
        onClick={stop}
      >
        <DropdownMenuLabel className="px-3 py-2.5 text-sm font-semibold truncate text-foreground">
          {row.name ?? "Actions"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/50" />

        {/* Quick Adjustments Section */}
        <div className="px-1 py-1.5">
          <DropdownMenuItem
            disabled={adjusting}
            onSelect={() => onQuickAdjust(row, -1, "Quick adjust -1")}
            className="px-3 py-2.5 rounded-md cursor-pointer transition-colors hover:bg-red-50 dark:hover:bg-red-950/30 focus:bg-red-50 dark:focus:bg-red-950/30 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-950/70 transition-colors">
                  <Minus className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Quick Adjust</span>
              </div>
              <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/50 px-2 py-0.5 rounded">-1</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={adjusting}
            onSelect={() => onQuickAdjust(row, +1, "Quick adjust +1")}
            className="px-3 py-2.5 rounded-md cursor-pointer transition-colors hover:bg-green-50 dark:hover:bg-green-950/30 focus:bg-green-50 dark:focus:bg-green-950/30 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400 group-hover:bg-green-200 dark:group-hover:bg-green-950/70 transition-colors">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Quick Adjust</span>
              </div>
              <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950/50 px-2 py-0.5 rounded">+1</span>
            </div>
          </DropdownMenuItem>
        </div>

        {/* Stocktake Section */}
        <div className="px-1 py-1.5">
          <DropdownMenuItem 
            disabled={setting}
            onSelect={() => onOpenStocktake(row)}
            className="px-3 py-2.5 rounded-md cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/30 focus:bg-blue-50 dark:focus:bg-blue-950/30 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-950/70 transition-colors">
                <ClipboardList className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Stocktake / set</span>
            </div>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="bg-border/50" />

        {/* Management Section */}
        <div className="px-1 py-1.5">
          <DropdownMenuItem
            disabled={!onView}
            onSelect={() => onView?.(row)}
            className="px-3 py-2.5 rounded-md cursor-pointer transition-colors hover:bg-accent focus:bg-accent disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted text-muted-foreground group-hover:bg-muted/80 transition-colors">
                <Eye className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">View</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={!onEdit}
            onSelect={() => onEdit?.(row)}
            className="px-3 py-2.5 rounded-md cursor-pointer transition-colors hover:bg-accent focus:bg-accent disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted text-muted-foreground group-hover:bg-muted/80 transition-colors">
                <Pencil className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Edit</span>
            </div>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}