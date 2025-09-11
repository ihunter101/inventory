"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/toaster";
import { Plus, Search, Trash2, Loader2 } from "lucide-react";

import {
  useGetPurchaseOrdersQuery,
  useCreateSupplierInvoiceMutation,
  useGetProductsQuery,
  SupplierInvoiceDTO,
  InvoiceLine,
  PurchaseOrderDTO,
  Product,
} from "@/app/state/api";

type Props = {
  onSuccess?: (invoiceNumber: string) => void;
};

type LineRow = {
  productId?: string;
  name?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
};

function money(n: number) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

export default function InvoiceForm({ onSuccess }: Props) {
  const { toast } = useToast();

  // ---------- PO search / select ----------
  const [poSearch, setPoSearch] = React.useState("");
  const [selectedPO, setSelectedPO] = React.useState<PurchaseOrderDTO | null>(null);

  const { data: poResults = [], isFetching: poSearching } =
    useGetPurchaseOrdersQuery(poSearch ? { q: poSearch } : undefined, {
      refetchOnMountOrArgChange: true,
    });

  // ---------- products (for name/unit hints) ----------
  const { data: products = [] } = useGetProductsQuery();

  // ---------- form state ----------
  const [invoiceNumber, setInvoiceNumber] = React.useState(genInvoiceNumber());
  const [date, setDate] = React.useState<string>(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = React.useState<string>("");

  const [rows, setRows] = React.useState<LineRow[]>([]);
  const [taxPct, setTaxPct] = React.useState<number>(0);

  // mutation (drives submit loading state)
  const [createInvoice, { isLoading }] = useCreateSupplierInvoiceMutation();

  function choosePO(po: PurchaseOrderDTO) {
    setSelectedPO(po);

    const seeded: LineRow[] = (po.items ?? []).map((it) => ({
      productId: it.productId,
      name: it.name,
      unit: it.unit,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
    }));

    setRows(
      seeded.length
        ? seeded
        : [{ quantity: 1, unitPrice: 0, unit: "", name: "", productId: undefined }]
    );
  }

  function updateRow(idx: number, patch: Partial<LineRow>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { quantity: 1, unitPrice: 0, unit: "", name: "", productId: undefined }]);
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  const subtotal = rows.reduce((s, r) => s + money(r.quantity) * money(r.unitPrice), 0);
  const tax = subtotal * (money(taxPct) / 100);
  const amount = subtotal + tax;

  async function onSubmit() {
    if (!selectedPO) {
      toast({ variant: "destructive", title: "Select a PO first" });
      return;
    }
    if (!rows.length || rows.some((r) => !r.productId || r.quantity <= 0)) {
      toast({
        variant: "destructive",
        title: "Add at least one valid line (product + quantity)",
      });
      return;
    }

    const lines: InvoiceLine[] = rows.map((r) => {
      const found = r.productId ? products.find((p) => p.productId === r.productId) : undefined;
      return {
        productId: r.productId!,
        sku: r.productId,
        name: r.name || found?.name || "",
        unit: r.unit || found?.unit || "",
        quantity: Number(r.quantity) || 0,
        unitPrice: Number(r.unitPrice) || 0,
        lineTotal: (Number(r.quantity) || 0) * (Number(r.unitPrice) || 0),
      };
    });

    try {
      const body: Partial<SupplierInvoiceDTO> = {
        invoiceNumber,
        supplierId: selectedPO.supplierId,
        poId: selectedPO.id,
        status: "PENDING",
        date,
        dueDate: dueDate || undefined,
        lines,
        amount,
      };

      await createInvoice(body).unwrap();
      toast({ title: "Invoice created", description: invoiceNumber });
      onSuccess?.(invoiceNumber);

      // reset if staying on page
      setInvoiceNumber(genInvoiceNumber());
      setDate(new Date().toISOString().slice(0, 10));
      setDueDate("");
      setRows([]);
      setTaxPct(0);
      setSelectedPO(null);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Failed to create invoice",
        description: e?.data?.message || "Please try again.",
      });
    }
  }

  return (
    <div className="relative rounded-2xl bg-white/90 p-6 shadow-card ring-1 ring-black/5">
      {/* SUBMIT OVERLAY */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Creating invoice…</span>
          </div>
        </div>
      )}

      {/* PO picker */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <Label>PO Number</Label>
          <div className="mt-2 flex gap-2">
            <Input
              placeholder="Type PO number (e.g. PO-2025-0001) or supplier"
              value={poSearch}
              onChange={(e) => setPoSearch(e.target.value)}
              disabled={isLoading}
            />
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={isLoading}>
                  {poSearching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching…
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Find
                    </>
                  )}
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-xl flex max-h-[80vh] flex-col overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Select a Purchase Order</DialogTitle>
                  <DialogDescription>
                    Results for: <span className="font-medium">{poSearch || "all"}</span>
                  </DialogDescription>
                </DialogHeader>

                <div className="rounded-lg border">
                  <ScrollArea className="h-[60vh]">
                    <ul className="divide-y">
                      {poSearching && (
                        <li className="px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Searching…
                        </li>
                      )}

                      {!poSearching &&
                        poResults.map((po) => (
                          <li
                            key={po.id}
                            className="cursor-pointer px-4 py-3 hover:bg-slate-50"
                            onClick={() => choosePO(po)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{po.poNumber}</div>
                              <div className="text-sm text-slate-500">{po.status}</div>
                            </div>
                            <div className="text-sm text-slate-500">
                              {po.supplier} • {new Date(po.orderDate).toLocaleDateString()}
                            </div>
                          </li>
                        ))}

                      {!poSearching && !poResults.length && (
                        <li className="px-4 py-6 text-sm text-slate-500">
                          No matching purchase orders.
                        </li>
                      )}
                    </ul>
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {selectedPO && (
            <div className="mt-2 text-sm text-slate-600">
              Supplier: <span className="font-medium">{selectedPO.supplier}</span>
            </div>
          )}
        </div>

        <div>
          <Label>Invoice Number</Label>
          <Input
            className="mt-2"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div>
          <Label>Invoice Date</Label>
          <Input
            type="date"
            className="mt-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div>
          <Label>Due Date</Label>
          <Input
            type="date"
            className="mt-2"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Lines */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">Invoice Lines</h3>
          <Button variant="secondary" size="sm" onClick={addRow} disabled={isLoading}>
            <Plus className="mr-2 h-4 w-4" /> Add Line
          </Button>
        </div>

        {/* Scrollable lines with sticky header */}
        <div
          className="
            h-[52vh] overflow-y-auto rounded-lg border
            scroll-smooth
            [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.300)_transparent]
          "
        >
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm">
              <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
                <th className="w-[22rem]">Product</th>
                <th className="w-28">Unit</th>
                <th className="w-24">Qty</th>
                <th className="w-36">Unit Price</th>
                <th className="w-36 text-right">Line Total</th>
                <th className="w-10 text-right" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => {
                const p = r.productId ? products.find((pp) => pp.productId === r.productId) : undefined;
                const line = money(r.quantity) * money(r.unitPrice);

                return (
                  <tr key={idx} className="border-t align-top">
                    <td className="px-3 py-2">
                      {/* Simple, fast selector: input + datalist */}
                      <Input
                        list={`inv-products-${idx}`}
                        value={r.name ?? ""}
                        placeholder="Type product name"
                        onChange={(e) => {
                          const name = e.target.value;
                          const match = products.find((prod) => prod.name === name);
                          updateRow(idx, {
                            name,
                            productId: match?.productId ?? r.productId,
                            unit: r.unit || match?.unit || "",
                          });
                        }}
                        disabled={isLoading}
                      />
                      <datalist id={`inv-products-${idx}`}>
                        {products.map((prod: Product) => (
                          <option key={prod.productId} value={prod.name} />
                        ))}
                      </datalist>
                      <div className="mt-1 text-xs text-slate-500 truncate">
                        {r.productId ? `ID: ${r.productId}` : "Unlinked product"}
                      </div>
                    </td>

                    <td className="px-3 py-2">
                      <Input
                        value={r.unit ?? ""}
                        placeholder={p?.unit ?? "e.g. box"}
                        onChange={(e) => updateRow(idx, { unit: e.target.value })}
                        disabled={isLoading}
                      />
                    </td>

                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        value={r.quantity}
                        onChange={(e) => updateRow(idx, { quantity: Number(e.target.value) })}
                        disabled={isLoading}
                      />
                    </td>

                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={r.unitPrice}
                        onChange={(e) => updateRow(idx, { unitPrice: Number(e.target.value) })}
                        disabled={isLoading}
                      />
                    </td>

                    <td className="px-3 py-2 text-right font-medium">${line.toFixed(2)}</td>

                    <td className="px-3 py-2 text-right">
                      <Button variant="ghost" size="icon" onClick={() => removeRow(idx)} disabled={isLoading}>
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
      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
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
                value={taxPct}
                onChange={(e) => setTaxPct(Number(e.target.value))}
                disabled={isLoading}
              />
              <span className="text-muted-foreground">%</span>
            </div>
            <span className="font-medium">${tax.toFixed(2)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-base">
            <span className="font-semibold">Total</span>
            <span className="font-semibold">${amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center justify-end gap-3">
        <Button variant="outline" onClick={() => window.history.back()} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={isLoading || !selectedPO}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating…
            </>
          ) : (
            "Create Invoice"
          )}
        </Button>
      </div>
    </div>
  );
}

/** Simple invoice number generator */
function genInvoiceNumber() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const rand = Math.floor(100 + Math.random() * 900);
  return `SI-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${rand}`;
}
