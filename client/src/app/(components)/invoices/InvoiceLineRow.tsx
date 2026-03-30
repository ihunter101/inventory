"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import type { LineRow, ProductIndex } from "@/app/features/lib/types";
import type { ProductDraft } from "@/app/state/api";
import { money } from "@/app/features/lib/helper";

type Props = {
  row: LineRow;
  productDrafts: ProductDraft[];
  productIndex: ProductIndex;
  onPatch: (rowId: string, patch: Partial<LineRow>) => void;
  onRemove: (rowId: string) => void;
  disabled?: boolean;
  //mode: "create" | "edit";
};

export default function InvoiceLineRow({
  row,
  productDrafts,
  productIndex,
  onPatch,
  onRemove,
  disabled,
  //mode = "create"
}: Props) {
  const p = row.productId ? productIndex.byId.get(row.productId) : undefined;
  const lineTotal = money(row.quantity) * money(row.unitPrice);
  const displayName = p?.name ?? row?.name;

  //const isReadOnly = mode === "edit"

  return (
    <tr className="border-t border-border/60 align-top transition-colors hover:bg-muted/20">
      <td className="px-3 py-3 sm:px-4">
        <Input
          list={`inv-products-${row.id}`}
          className="h-10 w-full text-sm sm:h-11 sm:text-base"
          value={displayName}
          placeholder="Type product name"
          onChange={(e) => {
            const name = e.target.value;
            const match = productIndex.byName.get(name.trim().toLowerCase());

            onPatch(row.id ?? p?.id, {
              name,
              productId: match?.id,
              unit: match ? match.unit : row.unit,
            });
          }}
          //disabled={disabled}
          //readOnly={isReadOnly}
        />

        <datalist id={`inv-products-${row.id}`}>
          {productDrafts.map((prod) => (
            <option key={prod.id} value={prod.name} />
          ))}
        </datalist>

        <div className="mt-1 truncate text-xs text-muted-foreground">
          {row.productId ? `ID: ${row.productId}` : "Unlinked product"}
        </div>
      </td>

      <td className="px-3 py-3 sm:px-4">
        <Input
          className="h-10 w-full text-sm sm:h-11 sm:text-base"
          value={row.unit}
          placeholder={p?.unit ?? "e.g. box"}
          onChange={(e) => onPatch(row.id, { unit: e.target.value })}
          //disabled={disabled}
          //readOnly={isReadOnly}
        />
      </td>

      <td className="px-3 py-3 sm:px-4">
        <Input
          className="h-10 w-full text-center text-sm sm:h-11 sm:text-base"
          type="number"
          min={0}
          value={row.quantity}
          onChange={(e) => onPatch(row.id, { quantity: Number(e.target.value) })}
          //disabled={disabled}
          //readOnly= {isReadOnly}
        />
      </td>

      <td className="px-3 py-3 sm:px-4">
        <Input
          className="h-10 w-full text-right text-sm tabular-nums sm:h-11 sm:text-base"
          type="number"
          step="0.01"
          min={0}
          value={row.unitPrice}
          onChange={(e) => onPatch(row.id, { unitPrice: Number(e.target.value) })}
          //disabled={disabled}
          //readOnly={isReadOnly}
        />
      </td>

      <td className="px-3 py-3 text-right font-semibold tabular-nums text-foreground sm:px-4">
        ${lineTotal.toFixed(2)}
      </td>

      <td className="px-3 py-3 text-right sm:px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(row.id)}
          disabled={disabled}
          className="h-8 w-8 sm:h-9 sm:w-9"
        >
          <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
        </Button>
      </td>
    </tr>
  );
}