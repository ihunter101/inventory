"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ComboOption } from "@/app/(components)/purchase-order/utils/po";
import { safeNumber } from "@/app/(components)/purchase-order/utils/po";
import { ComboSelect } from "./ComboSelect";

export type DraftProductLite = { id: string; name: string; unit?: string };

export type ItemRow = {
  draftProductId: string;
  productId?: string;
  name?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
};

type Props = {
  rows: ItemRow[];
  onChange: (rows: ItemRow[]) => void;

  drafts: DraftProductLite[];
  draftOptions: ComboOption[];
  onCreateDraft: (label: string) => Promise<ComboOption>;

  disabled?: boolean;
};

export function POItemsTable({
  rows,
  onChange,
  drafts,
  draftOptions,
  onCreateDraft,
  disabled = false,
}: Props) {
  const updateRow = React.useCallback(
    (idx: number, patch: Partial<ItemRow>) => {
      onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    },
    [onChange, rows]
  );

  const addRow = React.useCallback(() => {
    onChange([
      ...rows,
      { quantity: 1, unitPrice: 0, unit: "", name: "", draftProductId: "" },
    ]);
  }, [onChange, rows]);

  const removeRow = React.useCallback(
    (idx: number) => {
      onChange(rows.filter((_, i) => i !== idx));
    },
    [onChange, rows]
  );

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-900">Order Items</h3>
        <Button variant="secondary" size="sm" onClick={addRow} disabled={disabled}>
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>

      <div
        className="
          h-[42vh] overflow-y-auto rounded-2xl border-2 border-slate-200 shadow-sm
          scroll-smooth
          [scrollbar-width:thin]
          [scrollbar-color:theme(colors.slate.300)_transparent]
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
            <tr className="[&>th]:px-4 [&>th]:py-3 text-left text-slate-700 font-semibold">
              <th>Product (Draft)</th>
              <th>Unit</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th className="text-right">Line Total</th>
              <th className="text-right" />
            </tr>
          </thead>

          <tbody>
            {rows.map((r, idx) => {
              const selected = drafts.find((d) => d.id === r.draftProductId);
              const line = safeNumber(r.quantity) * safeNumber(r.unitPrice);

              return (
                <tr key={idx} className="border-t align-top">
                  <td className="px-4 py-4">
                    <ComboSelect
                      value={r.draftProductId ?? ""}
                      onChange={(v) => {
                        const d = drafts.find((dd) => dd.id === v);
                        updateRow(idx, {
                          draftProductId: v,
                          name: d?.name ?? r.name ?? "",
                          unit: d?.unit ?? r.unit ?? "",
                        });
                      }}
                      options={draftOptions}
                      placeholder="Select or create draft product"
                      allowCreate
                      onCreate={onCreateDraft}
                    />

                    {!!r.draftProductId && (
                      <div className="mt-1.5 truncate text-xs text-slate-500">
                        Draft ID: {r.draftProductId}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <Input
                      className="h-12 text-base px-3"
                      value={r.unit ?? ""}
                      placeholder={selected?.unit ?? "e.g. box"}
                      onChange={(e) => updateRow(idx, { unit: e.target.value })}
                      disabled={disabled}
                    />
                  </td>

                  <td className="px-4 py-4">
                    <Input
                      className="h-12 text-base px-3 text-center"
                      type="number"
                      min={0}
                      value={r.quantity}
                      onChange={(e) => updateRow(idx, { quantity: Number(e.target.value) })}
                      disabled={disabled}
                    />
                  </td>

                  <td className="px-4 py-4">
                    <Input
                      className="h-12 text-base px-3 text-right tabular-nums"
                      type="number"
                      step="0.01"
                      min={0}
                      value={r.unitPrice}
                      onChange={(e) => updateRow(idx, { unitPrice: Number(e.target.value) })}
                      disabled={disabled}
                    />
                  </td>

                  <td className="px-4 py-4 text-right font-semibold tabular-nums text-base">
                    ${line.toFixed(2)}
                  </td>

                  <td className="px-4 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(idx)}
                      disabled={disabled || rows.length === 1}
                      title={rows.length === 1 ? "Keep at least one row" : "Remove"}
                    >
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
