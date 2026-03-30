"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader as DialogH,
  DialogTitle as DialogT,
  DialogDescription as DialogD,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search } from "lucide-react";
import type { POSelectProps } from "@/app/features/lib/types";

export default function PurchaseOrderPicker({
  poSearch,
  setPoSearch,
  poSearching,
  displayedPOs,
  selectedPO,
  onChoosePO,
  disabled,
  onClearPO,
}: POSelectProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="min-w-0">
      <Label className="text-sm text-muted-foreground">Purchase Order</Label>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <Input
          className="h-11 min-w-0 text-[15px]"
          placeholder="Type PO number (e.g. PO-2025-0001) or supplier"
          value={poSearch}
          onChange={(e) => setPoSearch(e.target.value)}
          disabled={disabled}
          readOnly={!!selectedPO && !poSearching}
        />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-11 w-full px-4 sm:w-auto"
              disabled={disabled}
            >
              {poSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching…
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Find
                </>
              )}
            </Button>
          </DialogTrigger>

          <DialogContent className="flex max-h-[85vh] w-[95vw] max-w-2xl flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-0 sm:max-h-[80vh]">
            <DialogH className="px-4 pt-5 sm:px-6 sm:pt-6">
              <DialogT className="text-lg text-foreground sm:text-xl">
                Select a Purchase Order
              </DialogT>
              <DialogD className="text-sm text-muted-foreground sm:text-[15px]">
                Results for:{" "}
                <span className="font-medium text-foreground">
                  {poSearch?.trim() || "all"}
                </span>
              </DialogD>
            </DialogH>

            <div className="px-4 pb-4 pt-3 sm:px-6 sm:pb-6">
              <div className="rounded-xl border border-border/60 bg-background">
                <ScrollArea className="h-[50vh] sm:h-[60vh]">
                  <ul className="divide-y divide-border/60">
                    {poSearching && (
                      <li className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Searching…
                      </li>
                    )}

                    {!poSearching &&
                      displayedPOs.map((po) => (
                        <li
                          key={po.id}
                          className="cursor-pointer px-4 py-3 transition-colors hover:bg-muted/30"
                          onClick={() => {
                            onChoosePO(po);
                            setOpen(false);
                          }}
                        >
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-[15px] font-medium text-foreground">
                              {po.poNumber}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {po.status}
                            </div>
                          </div>

                          <div className="mt-1 text-sm text-muted-foreground">
                            {po.supplier?.name ?? "Unknown supplier"} •{" "}
                            {new Date(po.orderDate).toLocaleDateString()}
                          </div>
                        </li>
                      ))}

                    {!poSearching && !displayedPOs.length && (
                      <li className="px-4 py-6 text-sm text-muted-foreground">
                        No matching purchase orders.
                      </li>
                    )}
                  </ul>
                </ScrollArea>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedPO && (
        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Supplier:
            </span>
            <span className="truncate text-sm font-semibold text-foreground">
              {selectedPO.supplier?.name ?? selectedPO.supplierId}
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClearPO}
            className="h-8 w-full rounded-full px-3 text-xs font-medium sm:ml-3 sm:w-auto"
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}