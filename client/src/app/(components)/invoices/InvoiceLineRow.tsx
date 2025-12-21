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
    <tr className="border-t align-top">
      <td className="px-4 py-3">
        <Input
          list={`inv-products-${row.id}`}
          className="h-11 w-full"
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

        <div className="mt-1 truncate text-xs text-slate-500">
          {row.productId ? `ID: ${row.productId}` : "Unlinked product"}
        </div>
      </td>

      <td className="px-4 py-3">
        <Input
          className="h-11 w-full"
          value={row.unit}
          placeholder={p?.unit ?? "e.g. box"}
          onChange={(e) => onPatch(row.id, { unit: e.target.value })}
          //disabled={disabled}
          //readOnly={isReadOnly}
        />
      </td>

      <td className="px-4 py-3">
        <Input
          className="h-11 w-full text-center"
          type="number"
          min={0}
          value={row.quantity}
          onChange={(e) => onPatch(row.id, { quantity: Number(e.target.value) })}
          //disabled={disabled}
          //readOnly= {isReadOnly}
        />
      </td>

      <td className="px-4 py-3">
        <Input
          className="h-11 w-full text-right tabular-nums"
          type="number"
          step="0.01"
          min={0}
          value={row.unitPrice}
          onChange={(e) => onPatch(row.id, { unitPrice: Number(e.target.value) })}
          //disabled={disabled}
          //readOnly={isReadOnly}
        />
      </td>

      <td className="px-4 py-3 text-right font-semibold tabular-nums">
        ${lineTotal.toFixed(2)}
      </td>

      <td className="px-4 py-3 text-right">
        <Button variant="ghost" size="icon" onClick={() => onRemove(row.id)} disabled={disabled}>
          <Trash2 className="h-4 w-4 text-rose-600" />
        </Button>
      </td>
    </tr>
  );
}
