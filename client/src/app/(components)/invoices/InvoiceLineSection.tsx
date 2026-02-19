//client/src/app/(components)/invoices/invoiceLineSection
"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { LineRow, ProductIndex } from "@/app/features/lib/types";
import type { ProductDraft } from "@/app/state/api";
import InvoiceLinesTable from "@/app/(components)/invoices/InvoiceLineTable";

type Props = {
  rows: LineRow[];
  productDrafts: ProductDraft[];
  productIndex: ProductIndex;
  onAddRow: () => void;
  onPatchRow: (rowId: string, patch: Partial<LineRow>) => void;
  onRemoveRow: (rowId: string) => void;
  disabled?: boolean;
  //mode: "create" | "edit";
};

export default function InvoiceLinesSection({
  rows,
  productDrafts,
  productIndex,
  onAddRow,
  onPatchRow,
  onRemoveRow,
  disabled,
 // mode = "create"
}: Props) {
  //const isReadOnly = mode === "edit";
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-900">Invoice Lines</h3>
        <Button variant="secondary" size="sm" onClick={onAddRow} disabled={disabled}>
          <Plus className="mr-2 h-4 w-4" />
          Add Line
        </Button>
      </div>

      <InvoiceLinesTable
        rows={rows}
        productDrafts={productDrafts}
        productIndex={productIndex}
        onPatchRow={onPatchRow}
        onRemoveRow={onRemoveRow}
        //disabled={disabled || isReadOnly}
       // mode={mode}
      />
    </div>
  );
}
