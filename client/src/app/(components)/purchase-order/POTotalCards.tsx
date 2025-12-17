// src/app/features/purchase-orders/components/POTotalsCard.tsx
"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

type Props = {
  subtotal: number;
  taxPercent: number;
  onTaxPercentChange: (next: number) => void;
};

export function POTotalsCard({ subtotal, taxPercent, onTaxPercentChange }: Props) {
  const tax = subtotal * (Number.isFinite(taxPercent) ? taxPercent : 0) / 100;
  const total = subtotal + tax;

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/50 p-6">
      <div className="flex items-center justify-between text-[15px]">
        <span className="text-slate-600">Subtotal</span>
        <span className="font-semibold tabular-nums">
          ${subtotal.toFixed(2)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-[15px]">
        <div className="flex items-center gap-2">
          <span className="text-slate-600">Tax</span>
          <Input
            className="h-9 w-16 text-center"
            type="number"
            min={0}
            step="0.5"
            value={taxPercent}
            onChange={(e) => onTaxPercentChange(Number(e.target.value))}
          />
          <span className="text-slate-600">%</span>
        </div>
        <span className="font-semibold tabular-nums">${tax.toFixed(2)}</span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t-2 border-slate-300 pt-4 text-lg">
        <span className="font-bold text-slate-900">Total</span>
        <span className="font-bold text-slate-900 tabular-nums">
          ${total.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
