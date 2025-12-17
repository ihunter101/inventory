"use client";

import { Input } from "@/components/ui/input";

type Props = {
  subtotal: number;
  taxPct: number;
  //setTaxPct: (n: number) => void;
  tax: number;
  amount: number;
  disabled?: boolean;
  poTax: number;
};

export default function InvoiceSummaryCard({
  subtotal,
  taxPct,
  //setTaxPct,
  poTax,
  tax,
  amount,
  disabled,
}: Props) {
  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <div className="flex items-center justify-between text-[15px]">
        <span className="text-slate-600">Subtotal</span>
        <span className="font-semibold">${subtotal.toFixed(2)}</span>
      </div>

      <div className="mt-2 flex items-center justify-between text-[15px]">
        <div className="flex items-center gap-2">
          <span className="text-slate-600">Tax</span>
          <Input
            className="h-9 w-20"
            type="number"
            min={0}
            step="0.5"
            value={poTax}
            //onChange={(e) => setTaxPct(Number(e.target.value))}
            disabled={disabled}
            readOnly={poTax !==null }
          />
          <span className="text-slate-600">%</span>
        </div>
        <span className="font-semibold">${tax.toFixed(2)}</span>
      </div>

      <div className="mt-3 flex items-center justify-between text-lg">
        <span className="font-semibold">Total</span>
        <span className="font-semibold">${amount.toFixed(2)}</span>
      </div>
    </div>
  );
}
