"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

type Props = {
  subtotal: number;
  taxPercent: number;
  onTaxPercentChange: (next: number) => void;
};

export function POTotalsCard({
  subtotal,
  taxPercent,
  onTaxPercentChange,
}: Props) {
  const safeTaxPercent = Number.isFinite(taxPercent) ? taxPercent : 0;
  const tax = (subtotal * safeTaxPercent) / 100;
  const total = subtotal + tax;

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 text-sm sm:text-[15px]">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-semibold tabular-nums text-foreground">
            ${subtotal.toFixed(2)}
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm sm:text-[15px]">
            <span className="text-muted-foreground">Tax</span>

            <Input
              className="h-9 w-20 text-center sm:w-16"
              type="number"
              min={0}
              step="0.5"
              value={taxPercent}
              onChange={(e) => onTaxPercentChange(Number(e.target.value))}
            />

            <span className="text-muted-foreground">%</span>
          </div>

          <span className="font-semibold tabular-nums text-foreground">
            ${tax.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-4 text-base sm:text-lg">
          <span className="font-bold text-foreground">Total</span>
          <span className="font-bold tabular-nums text-foreground">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}