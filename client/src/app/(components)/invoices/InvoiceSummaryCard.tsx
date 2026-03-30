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
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-4 text-sm sm:text-[15px]">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-semibold tabular-nums text-foreground">
          ${subtotal.toFixed(2)}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:text-[15px]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground">Tax</span>
          <Input
            className="h-9 w-20 text-center"
            type="number"
            min={0}
            step="0.5"
            value={poTax}
            //onChange={(e) => setTaxPct(Number(e.target.value))}
            disabled={disabled}
            readOnly={poTax !== null}
          />
          <span className="text-muted-foreground">%</span>
        </div>

        <span className="font-semibold tabular-nums text-foreground">
          ${tax.toFixed(2)}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-border/60 pt-4 text-base sm:text-lg">
        <span className="font-semibold text-foreground">Total</span>
        <span className="font-semibold tabular-nums text-foreground">
          ${amount.toFixed(2)}
        </span>
      </div>
    </div>
  );
}