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
    <div className="md:col-span-2">
      <Label className="text-sm text-slate-600">Purchase Order</Label>

      <div className="mt-2 flex gap-2">
        <Input
          className="h-11 text-[15px]"
          placeholder="Type PO number (e.g. PO-2025-0001) or supplier"
          value={poSearch}
          onChange={(e) => setPoSearch(e.target.value)}
          disabled={disabled}
          readOnly={!!selectedPO && !poSearching}
        />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-11 px-4" disabled={disabled}>
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

          <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col overflow-hidden rounded-2xl">
            <DialogH>
              <DialogT className="text-xl">Select a Purchase Order</DialogT>
              <DialogD className="text-[15px]">
                Results for:{" "}
                <span className="font-medium">{poSearch?.trim() || "all"}</span>
              </DialogD>
            </DialogH>

            <div className="rounded-xl border">
              <ScrollArea className="h-[60vh]">
                <ul className="divide-y">
                  {poSearching && (
                    <li className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching…
                    </li>
                  )}

                  {!poSearching &&
                    displayedPOs.map((po) => (
                      <li
                        key={po.id}
                        className="cursor-pointer px-4 py-3 transition hover:bg-slate-50"
                        onClick={() => {
                          onChoosePO(po);
                          setOpen(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-[15px] font-medium">
                            {po.poNumber}
                          </div>
                          <div className="text-sm text-slate-500">
                            {po.status}
                          </div>
                        </div>
                        <div className="text-sm text-slate-500">
                          {po.supplier?.name ?? "Unknown supplier"} •{" "}
                          {new Date(po.orderDate).toLocaleDateString()}
                        </div>
                      </li>
                    ))}

                  {!poSearching && !displayedPOs.length && (
                    <li className="px-4 py-6 text-sm text-slate-500">
                      No matching purchase orders.
                    </li>
                  )}
                </ul>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedPO && (
        <div className="mt-3 flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex min-w-0 flex-col">
            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Supplier:
            </span>
            <span className="truncate text-sm font-semibold text-slate-700">
              {selectedPO.supplier?.name ?? selectedPO.supplierId}
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClearPO}
            className="ml-3 inline-flex h-8 items-center rounded-full border-slate-300 px-3 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
