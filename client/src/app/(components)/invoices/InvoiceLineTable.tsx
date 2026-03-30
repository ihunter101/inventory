"use client";

import type { LineRow, ProductIndex } from "@/app/features/lib/types";
import type { ProductDraft } from "@/app/state/api";
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
    <>
      {/* MOBILE / SMALL TABLET CARDS */}
      <div className="space-y-4 md:hidden">
        {rows.map((row, index) => {
          const p = row.productId ? productIndex.byId.get(row.productId) : undefined;
          const displayName = p?.name ?? row?.name;
          const lineTotal = (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0);

          return (
            <div
              key={row.id}
              className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Line {index + 1}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {row.productId ? `ID: ${row.productId}` : "Unlinked product"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">
                    Product
                  </label>
                  <input
                    list={`inv-products-mobile-${row.id}`}
                    className="flex h-10 w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none ring-0 placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={displayName}
                    placeholder="Type product name"
                    onChange={(e) => {
                      const name = e.target.value;
                      const match = productIndex.byName.get(name.trim().toLowerCase());

                      onPatchRow(row.id, {
                        name,
                        productId: match?.id,
                        unit: match ? match.unit : row.unit,
                      });
                    }}
                    disabled={disabled}
                    //readOnly={isReadOnly}
                  />

                  <datalist id={`inv-products-mobile-${row.id}`}>
                    {productDrafts.map((prod) => (
                      <option key={prod.id} value={prod.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">
                    Unit
                  </label>
                  <input
                    className="flex h-10 w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none ring-0 placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={row.unit}
                    placeholder={p?.unit ?? "e.g. box"}
                    onChange={(e) => onPatchRow(row.id, { unit: e.target.value })}
                    disabled={disabled}
                    //readOnly={isReadOnly}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">
                    Qty
                  </label>
                  <input
                    className="flex h-10 w-full rounded-md border border-border/60 bg-background px-3 py-2 text-center text-sm text-foreground outline-none ring-0 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    type="number"
                    min={0}
                    value={row.quantity}
                    onChange={(e) =>
                      onPatchRow(row.id, { quantity: Number(e.target.value) })
                    }
                    disabled={disabled}
                    //readOnly= {isReadOnly}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">
                    Unit Price
                  </label>
                  <input
                    className="flex h-10 w-full rounded-md border border-border/60 bg-background px-3 py-2 text-right text-sm tabular-nums text-foreground outline-none ring-0 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    type="number"
                    step="0.01"
                    min={0}
                    value={row.unitPrice}
                    onChange={(e) =>
                      onPatchRow(row.id, { unitPrice: Number(e.target.value) })
                    }
                    disabled={disabled}
                    //readOnly={isReadOnly}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">
                    Line Total
                  </label>
                  <div className="flex h-10 items-center rounded-md border border-border/60 bg-muted/30 px-3 text-sm font-semibold tabular-nums text-foreground">
                    ${lineTotal.toFixed(2)}
                  </div>
                </div>

                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onRemoveRow(row.id)}
                    disabled={disabled}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-border/60 bg-background px-3 text-sm text-rose-600 transition-colors hover:bg-muted/40 disabled:opacity-50 dark:text-rose-400"
                  >
                    Remove
                  </button>
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
          max-h-[54vh] overflow-auto rounded-2xl border border-border/60 bg-card shadow-sm
          scroll-smooth
          [scrollbar-width:thin]
        "
      >
        <table className="min-w-[920px] w-full text-sm lg:text-[15px]">
          <colgroup>
            <col className="w-[38%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[16%]" />
            <col className="w-[14%]" />
            <col className="w-[4%]" />
          </colgroup>

          <thead className="sticky top-0 z-10 bg-muted/30 backdrop-blur supports-[backdrop-filter]:bg-muted/20">
            <tr className="[&>th]:px-4 [&>th]:py-3 text-left text-muted-foreground">
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
    </>
  );
}