"use client";

import type { LineRow, ProductIndex } from "@/app/features/lib/types";
import type{ ProductDraft } from "@/app/state/api";
import InvoiceLineRow from "./InvoiceLineRow";

type Props = {
  rows: LineRow[];
  productDrafts: ProductDraft[];
  productIndex: ProductIndex;
  onPatchRow: (rowId: string, patch: Partial<LineRow>) => void;
  onRemoveRow: (rowId: string) => void;
  disabled?: boolean;
  //mode?: "create" | "edit";
};

export default function InvoiceLinesTable({
  rows,
  productDrafts,
  productIndex,
  onPatchRow,
  onRemoveRow,
  disabled,
  //mode = "create"
}: Props) {
  return (
    <div
      className="
        h-[54vh] overflow-y-auto rounded-2xl border shadow-sm
        scroll-smooth
        [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.300)_transparent]
      "
    >
      <table className="w-full table-fixed text-[15px]">
        <colgroup>
          <col className="w-[38%]" />
          <col className="w-[14%]" />
          <col className="w-[14%]" />
          <col className="w-[16%]" />
          <col className="w-[14%]" />
          <col className="w-[4%]" />
        </colgroup>

        <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur supports-[backdrop-filter]:bg-slate-50/60">
          <tr className="[&>th]:px-4 [&>th]:py-3 text-left text-slate-600">
            <th>Product</th>
            <th>Unit</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th className="text-right">Line Total</th>
            <th className="text-right" />
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <InvoiceLineRow
              key={row.id}
              row={row}
              productDrafts={productDrafts}
              productIndex={productIndex}
              onPatch={onPatchRow}
              onRemove={onRemoveRow}
              disabled={disabled}
              //mode={mode}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
