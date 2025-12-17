"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/toaster";
import ComboSelect, { ComboOption } from "./components/Combobox";
import { genPONumber } from "@/app/utils/GenPONumber";

import {
  useGetSuppliersQuery,
  useGetProductsQuery,
  useCreateProductMutation,
  useCreatePurchaseOrderMutation,
  NewPurchaseOrderDTO,
  POItem,
  Product,
  Supplier,
} from "@/app/state/api";

type ItemRow = {
  productId?: string;
  name?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
};

function money(n: number) {
  return Number.isFinite(n) ? n : 0;
}

export default function POForm({
  onSuccess,
}: {
  onSuccess?: (poNumber: string) => void;
}) {
  const { toast } = useToast();

  // data for selects
  const { data: suppliers = [] } = useGetSuppliersQuery();
  const { data: ProductResponse } = useGetProductsQuery();
  const [createProduct] = useCreateProductMutation();
  const [createPO, { isLoading }] = useCreatePurchaseOrderMutation();

  const supplierOptions: ComboOption[] = suppliers.map((s: Supplier) => ({
    value: s.supplierId,
    label: s.name,
  }));

  const products: Product[] = ProductResponse?.items ?? []
  const productOptions: ComboOption[] = products.map((p: Product) => ({
    value: p.productId,
    label: p.name,
  }));

  // form state
  const [supplierId, setSupplierId] = React.useState<string>("");
  const [poNumber, setPoNumber] = React.useState<string>(genPONumber());
  const [orderDate, setOrderDate] = React.useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [dueDate, setDueDate] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");

  const [taxPercent, setTaxPercent] = React.useState<number>(0);
  const [rows, setRows] = React.useState<ItemRow[]>([
    { quantity: 1, unitPrice: 0, unit: "", productId: undefined, name: "" },
  ]);

  const subtotal = rows.reduce(
    (s, r) => s + money(r.quantity) * money(r.unitPrice),
    0
  );
  const tax = subtotal * (money(taxPercent) / 100);
  const total = subtotal + tax;

  function updateRow(idx: number, patch: Partial<ItemRow>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((prev) => [
      ...prev,
      { quantity: 1, unitPrice: 0, unit: "", name: "", productId: undefined },
    ]);
  }
  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit() {
    if (!supplierId) {
      toast({ variant: "destructive", title: "Supplier required" });
      return;
    }
    if (!rows.length || rows.some((r) => !r.productId || r.quantity <= 0)) {
      toast({ variant: "destructive", title: "Add at least one valid item" });
      return;
    }

    const items: POItem[] = rows.map((r) => {
      const product: Product | undefined = products.find(
        (p) => p.productId === r.productId
      );
      const name = r.name || product?.name || "";
      const unit = r.unit || product?.unit || "";
      const quantity = Number(r.quantity) || 0;
      const unitPrice = Number(r.unitPrice) || 0;
      return {
        productId: r.productId!,
        sku: product?.productId,
        name,
        unit,
        quantity,
        unitPrice,
        lineTotal: quantity * unitPrice,
      };
    });

    const body: NewPurchaseOrderDTO = {
      poNumber,
      supplierId,
      status: "DRAFT",
      orderDate,
      dueDate: dueDate || undefined,
      notes: notes || undefined,
      items,
      subtotal,
      tax,
      total,
    };

    try {
      await createPO(body).unwrap();
      toast({ title: "Purchase Order created", description: poNumber });
      onSuccess?.(poNumber);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Failed to create PO",
        description: e?.data?.error || "Please try again.",
      });
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-black/5">
      {/* Supplier & meta */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label>Supplier</Label>
          <ComboSelect
            className="mt-2"
            value={supplierId}
            onChange={setSupplierId}
            options={supplierOptions}
            placeholder="Select supplier"
            allowCreate
            onCreate={async (label) => {
              // client-only add (replace with your create-supplier endpoint when ready)
              const tmp = { value: `tmp-${Date.now()}`, label };
              supplierOptions.unshift(tmp);
              setSupplierId(tmp.value);
              return tmp;
            }}
          />
        </div>

        <div>
          <Label>PO Number</Label>
          <Input
            className="mt-2"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            readOnly
          />
        </div>

        <div>
          <Label>Order Date</Label>
          <Input
            type="date"
            className="mt-2"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
          />
        </div>

        <div>
          <Label>Due Date</Label>
          <Input
            type="date"
            className="mt-2"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <Label>Notes</Label>
          <Input
            className="mt-2"
            placeholder="Optional"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      {/* Items */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">Order Items</h3>
          <Button variant="secondary" size="sm" onClick={addRow}>
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>

        {/* 👇 Fixed-height, scrollable area (instead of max-h) */}
        <div
          className="
      h-[52vh]    /* give it a real height so it can scroll */
      overflow-y-auto
      rounded-lg border
      scroll-smooth
      [scrollbar-width:thin]
      [scrollbar-color:theme(colors.slate.300)_transparent]
    "
        >
          <table className="w-full text-sm relative">
            {/* 👇 sticky header stays visible while rows scroll */}
            <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm">
              <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
                <th className="w-[22rem]">Product</th>
                <th className="w-32">Unit</th>
                <th className="w-24">Qty</th>
                <th className="w-36">Unit Price</th>
                <th className="w-36 text-right">Line Total</th>
                <th className="w-10 text-right" />
              </tr>
            </thead>

            <tbody>
              {rows.map((r, idx) => {
                const product = products.find(
                  (p) => p.productId === r.productId
                );
                const line = money(r.quantity) * money(r.unitPrice);

                return (
                  <tr key={idx} className="border-t">
                    <td className="px-3 py-2">
                      <ComboSelect
                        value={r.productId ?? ""}
                        onChange={(v) => {
                          const p = products.find((pp) => pp.productId === v);
                          updateRow(idx, {
                            productId: v,
                            name: p?.name ?? r.name ?? "",
                            unit: p?.unit ?? r.unit ?? "",
                            unitPrice: r.unitPrice || 0,
                          });
                        }}
                        options={productOptions}
                        placeholder="Select product"
                        allowCreate
                        onCreate={async (label) => {
                          const unit =
                            window.prompt("Unit (e.g. box, each)") || "each";
                          try {
                            const created = await createProduct({
                              name: label,
                              price: 0,
                              stockQuantity: 0,
                              rating: 0,
                            }).unwrap();

                            const opt = {
                              value: created.productId,
                              label: created.name,
                            };
                            // keep your local options in sync
                            productOptions.unshift(opt);

                            updateRow(idx, {
                              productId: created.productId,
                              name: created.name,
                              unit,
                            });
                            return opt;
                          } catch {
                            const opt = { value: `tmp-${Date.now()}`, label };
                            productOptions.unshift(opt);
                            updateRow(idx, {
                              productId: opt.value,
                              name: label,
                              unit,
                            });
                            return opt;
                          }
                        }}
                      />
                    </td>

                    <td className="px-3 py-2">
                      <Input
                        value={r.unit ?? ""}
                        placeholder={product?.unit ?? "e.g. box"}
                        onChange={(e) =>
                          updateRow(idx, { unit: e.target.value })
                        }
                      />
                    </td>

                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        value={r.quantity}
                        onChange={(e) =>
                          updateRow(idx, { quantity: Number(e.target.value) })
                        }
                      />
                    </td>

                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={r.unitPrice}
                        onChange={(e) =>
                          updateRow(idx, { unitPrice: Number(e.target.value) })
                        }
                      />
                    </td>

                    <td className="px-3 py-2 text-right font-medium">
                      ${line.toFixed(2)}
                    </td>

                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(idx)}
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

      {/* Totals */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="md:col-span-2" />
        <div className="rounded-xl border p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Tax</span>
              <Input
                className="h-8 w-16"
                type="number"
                min={0}
                step="0.5"
                value={taxPercent}
                onChange={(e) => setTaxPercent(Number(e.target.value))}
              />
              <span className="text-muted-foreground">%</span>
            </div>
            <span className="font-medium">${tax.toFixed(2)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-base">
            <span className="font-semibold">Total</span>
            <span className="font-semibold">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center justify-end gap-3">
        <Button
          variant="outline"
          type="button"
          onClick={() => history.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={isLoading}>
          {isLoading ? "Creating…" : "Create Purchase Order"}
        </Button>
      </div>
    </div>
  );
}
