"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/toaster";

import { genPONumber } from "@/app/utils/GenPONumber";
import {
  useGetSuppliersQuery,
  useGetProductsQuery,
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



export default function CreatePODialog({
  triggerClassName,
  variant = "primary",
}: {
  triggerClassName?: string;
  variant?: "primary" | "ghost";
}) {
  const { toast } = useToast();

  // Fetch dropdown data
  const { data: suppliers = [] } = useGetSuppliersQuery();
  const { data: products = [] } = useGetProductsQuery();

  // RTK mutation
  const [createPO, { isLoading }] = useCreatePurchaseOrderMutation();

  // Dialog state
  const [open, setOpen] = React.useState(false);

  // Form state
  const [supplierId, setSupplierId] = React.useState<string>("");
  const [poNumber, setPoNumber] = React.useState<string>(genPONumber());
  const [orderDate, setOrderDate] = React.useState<string>(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");

  const [taxPercent, setTaxPercent] = React.useState<number>(0);
  const [rows, setRows] = React.useState<ItemRow[]>([
    { quantity: 1, unitPrice: 0, unit: "", productId: undefined, name: "" },
  ]);

  // Derived totals
  const subtotal = rows.reduce((s, r) => s + money(r.quantity) * money(r.unitPrice), 0);
  const tax = subtotal * (money(taxPercent) / 100);
  const total = subtotal + tax;

  function updateRow(idx: number, patch: Partial<ItemRow>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { quantity: 1, unitPrice: 0, unit: "", name: "", productId: undefined }]);
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function resetForm() {
    setSupplierId("");
    setPoNumber(genPONumber());
    setOrderDate(new Date().toISOString().slice(0, 10));
    setDueDate("");
    setNotes("");
    setTaxPercent(0);
    setRows([{ quantity: 1, unitPrice: 0, unit: "", name: "", productId: undefined }]);
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

    // Map UI rows → API POItem
    const items: POItem[] = rows.map((r) => {
      const product: Product | undefined = products.find((p) => p.productId === r.productId);
      const name = r.name || product?.name || "";
      const unit = r.unit || product?.unit || "";
      const quantity = Number(r.quantity) || 0;
      const unitPrice = Number(r.unitPrice) || 0;

      return {
        productId: r.productId!, // validated above
        sku: product?.productId,
        name,
        unit,
        quantity,
        unitPrice,
        lineTotal: quantity * unitPrice,
      };
    });

    const body: NewPurchaseOrderDTO = {
      poNumber, // you can omit if the server prefers to assign
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
      setOpen(false);
      resetForm();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Failed to create PO",
        description: e?.data?.error || "Please try again.",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "primary" ? (
          <Button className={triggerClassName}>
            <Plus className="mr-2 h-4 w-4" />
            New Purchase Order
          </Button>
        ) : (
          <Button variant="ghost" className={triggerClassName}>
            <Plus className="mr-2 h-4 w-4" />
            New Purchase Order
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-3xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogDescription>Fill in supplier, dates and items. Totals are auto-calculated.</DialogDescription>
        </DialogHeader>

        {/* Supplier + Dates */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label>Supplier</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s: Supplier) => (
                  <SelectItem key={s.supplierId} value={s.supplierId}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>PO Number</Label>
            <Input className="mt-2" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} />
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
            <Input type="date" className="mt-2" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <Label>Notes</Label>
            <Input className="mt-2" placeholder="Optional" value={notes} onChange={(e) => setNotes(e.target.value)} />
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

          <ScrollArea className="max-h-[40vh] rounded-lg border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
                  <th className="w-56">Product</th>
                  <th className="w-28">Unit</th>
                  <th className="w-24">Qty</th>
                  <th className="w-32">Unit Price</th>
                  <th className="w-32 text-right">Line Total</th>
                  <th className="w-10 text-right" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const product = products.find((p) => p.productId === r.productId);
                  const line = money(r.quantity) * money(r.unitPrice);
                  return (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2">
                        <Select
                          value={r.productId ?? ""}
                          onValueChange={(v) => {
                            const p = products.find((pp) => pp.productId === v);
                            updateRow(idx, {
                              productId: v,
                              name: p?.name ?? "",
                              unit: p?.unit ?? r.unit,
                              unitPrice: r.unitPrice || 0,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto rounded-lg border bg-white shadow-lg" position="popper">
                            {products.map((p) => (
                              <SelectItem key={p.productId} value={p.productId}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      <td className="px-3 py-2">
                        <Input
                          value={r.unit ?? ""}
                          placeholder={product?.unit ?? "e.g. box"}
                          onChange={(e) => updateRow(idx, { unit: e.target.value })}
                        />
                      </td>

                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          value={r.quantity}
                          onChange={(e) => updateRow(idx, { quantity: Number(e.target.value) })}
                        />
                      </td>

                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={r.unitPrice}
                          onChange={(e) => updateRow(idx, { unitPrice: Number(e.target.value) })}
                        />
                      </td>

                      <td className="px-3 py-2 text-right font-medium">${line.toFixed(2)}</td>

                      <td className="px-3 py-2 text-right">
                        <Button variant="ghost" size="icon" onClick={() => removeRow(idx)}>
                          <Trash2 className="h-4 w-4 text-rose-600" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollArea>
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

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? "Creating…" : "Create Purchase Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
