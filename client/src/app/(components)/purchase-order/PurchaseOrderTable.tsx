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
    <div className="mb-8 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-foreground sm:text-xl">
          Order Items
        </h3>

        <Button
          variant="secondary"
          size="sm"
          onClick={addRow}
          disabled={disabled}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* MOBILE / SMALL TABLET CARDS */}
      <div className="space-y-4 md:hidden">
        {rows.map((r, idx) => {
          const selected = drafts.find((d) => d.id === r.draftProductId);
          const line = safeNumber(r.quantity) * safeNumber(r.unitPrice);

          return (
            <div
              key={idx}
              className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Item {idx + 1}
                  </p>
                  {!!r.draftProductId && (
                    <p className="mt-1 break-all text-xs text-muted-foreground">
                      Draft ID: {r.draftProductId}
                    </p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(idx)}
                  disabled={disabled || rows.length === 1}
                  title={rows.length === 1 ? "Keep at least one row" : "Remove"}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">
                    Product (Draft)
                  </label>
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
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-muted-foreground">
                      Unit
                    </label>
                    <Input
                      className="h-11 text-base"
                      value={r.unit ?? ""}
                      placeholder={selected?.unit ?? "e.g. box"}
                      onChange={(e) => updateRow(idx, { unit: e.target.value })}
                      disabled={disabled}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-muted-foreground">
                      Quantity
                    </label>
                    <Input
                      className="h-11 text-base"
                      type="number"
                      min={0}
                      value={r.quantity}
                      onChange={(e) =>
                        updateRow(idx, { quantity: Number(e.target.value) })
                      }
                      disabled={disabled}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-muted-foreground">
                      Unit Price
                    </label>
                    <Input
                      className="h-11 text-base"
                      type="number"
                      step="0.01"
                      min={0}
                      value={r.unitPrice}
                      onChange={(e) =>
                        updateRow(idx, { unitPrice: Number(e.target.value) })
                      }
                      disabled={disabled}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-muted-foreground">
                      Line Total
                    </label>
                    <div className="flex h-11 items-center rounded-md border border-border/60 bg-muted/30 px-3 text-sm font-semibold text-foreground">
                      ${line.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* TABLET / DESKTOP TABLE */}
      <div
        className="
          hidden md:block
          overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-sm
          [scrollbar-width:thin]
        "
      >
        <table className="min-w-[920px] w-full text-sm lg:text-[15px]">
          <colgroup>
            <col className="w-[34%]" />
            <col className="w-[14%]" />
            <col className="w-[12%]" />
            <col className="w-[16%]" />
            <col className="w-[16%]" />
            <col className="w-[8%]" />
          </colgroup>

          <thead className="sticky top-0 z-10 bg-muted/30 backdrop-blur supports-[backdrop-filter]:bg-muted/20">
            <tr className="[&>th]:px-4 [&>th]:py-3 text-left font-semibold text-muted-foreground">
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
                <tr
                  key={idx}
                  className="border-t border-border/60 align-top transition-colors hover:bg-muted/20"
                >
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
                      <div className="mt-1.5 truncate text-xs text-muted-foreground">
                        Draft ID: {r.draftProductId}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <Input
                      className="h-11 text-base"
                      value={r.unit ?? ""}
                      placeholder={selected?.unit ?? "e.g. box"}
                      onChange={(e) => updateRow(idx, { unit: e.target.value })}
                      disabled={disabled}
                    />
                  </td>

                  <td className="px-4 py-4">
                    <Input
                      className="h-11 text-base text-center"
                      type="number"
                      min={0}
                      value={r.quantity}
                      onChange={(e) =>
                        updateRow(idx, { quantity: Number(e.target.value) })
                      }
                      disabled={disabled}
                    />
                  </td>

                  <td className="px-4 py-4">
                    <Input
                      className="h-11 text-base text-right tabular-nums"
                      type="number"
                      step="0.01"
                      min={0}
                      value={r.unitPrice}
                      onChange={(e) =>
                        updateRow(idx, { unitPrice: Number(e.target.value) })
                      }
                      disabled={disabled}
                    />
                  </td>

                  <td className="px-4 py-4 text-right text-base font-semibold tabular-nums text-foreground">
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
                      <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
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