"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader as DialogH,
  DialogTitle as DialogT,
  DialogDescription as DialogD,
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

/* ---------------- types & helpers ---------------- */
type Props = { onSuccess?: (invoiceNumber: string) => void };

type LineRow = {
  productId?: string;
  name?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
};

const money = (n: number) => (Number.isFinite(Number(n)) ? Number(n) : 0);

function genInvoiceNumber() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const rand = Math.floor(100 + Math.random() * 900);
  return `SI-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${rand}`;
}

/* ---------------- component ---------------- */
export default function InvoiceForm({ onSuccess }: Props) {
  const { toast } = useToast();

  // PO search/selection
  const [poSearch, setPoSearch] = React.useState("");
  const [selectedPO, setSelectedPO] = React.useState<PurchaseOrderDTO | null>(null);
  const { data: poResults = [], isFetching: poSearching } =
    useGetPurchaseOrdersQuery(poSearch ? { q: poSearch } : undefined, {
      refetchOnMountOrArgChange: true,
    });

  // products (for name/unit hints)
  const { data: products = [] } = useGetProductsQuery();

  // form state
  const [invoiceNumber, setInvoiceNumber] = React.useState(genInvoiceNumber());
  const [date, setDate] = React.useState<string>(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = React.useState<string>("");

  const [rows, setRows] = React.useState<LineRow[]>([]);
  const [taxPct, setTaxPct] = React.useState<number>(0);

  // mutation
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

  const addRow = () =>
    setRows((prev) => [...prev, { quantity: 1, unitPrice: 0, unit: "", name: "", productId: undefined }]);

  const removeRow = (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx));

  const subtotal = rows.reduce((s, r) => s + money(r.quantity) * money(r.unitPrice), 0);
  const tax = subtotal * (money(taxPct) / 100);
  const amount = subtotal + tax;

  async function onSubmit() {
    if (!selectedPO) {
      toast({ variant: "destructive", title: "Select a PO first" });
      return;
    }
    if (!rows.length || rows.some((r) => !r.productId || r.quantity <= 0)) {
      toast({ variant: "destructive", title: "Add at least one valid line (product + quantity)" });
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

      // reset
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
    <Card className="relative rounded-3xl border-slate-200 bg-white/95 shadow-xl ring-1 ring-black/5">
      {/* submit overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-white/70 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-base">Creating invoice…</span>
          </div>
        </div>
      )}

      <CardHeader className="gap-2 p-8 pb-4 md:p-10 md:pb-6">
        <CardTitle className="text-3xl font-semibold tracking-tight text-slate-900">
          Supplier Invoice
        </CardTitle>
        <CardDescription className="text-[15px] text-slate-500">
          Find a purchase order; we’ll capture the supplier and you can refine the lines.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-8 pt-0 md:p-10 md:pt-0">
        {/* Meta row */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <Label className="text-sm text-slate-600">Invoice #</Label>
            <Input
              className="mt-2 h-11 text-[15px]"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div>
            <Label className="text-sm text-slate-600">Date</Label>
            <Input
              type="date"
              className="mt-2 h-11 text-[15px]"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div>
            <Label className="text-sm text-slate-600">Due date</Label>
            <Input
              type="date"
              className="mt-2 h-11 text-[15px]"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* PO + Summary */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Label className="text-sm text-slate-600">Purchase Order</Label>
            <div className="mt-2 flex gap-2">
              <Input
                className="h-11 text-[15px]"
                placeholder="Type PO number (e.g. PO-2025-0001) or supplier"
                value={poSearch}
                onChange={(e) => setPoSearch(e.target.value)}
                disabled={isLoading}
              />
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-11 px-4" disabled={isLoading}>
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

                <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col overflow-hidden rounded-2xl">
                  <DialogH>
                    <DialogT className="text-xl">Select a Purchase Order</DialogT>
                    <DialogD className="text-[15px]">
                      Results for: <span className="font-medium">{poSearch || "all"}</span>
                    </DialogD>
                  </DialogH>

                  <div className="rounded-xl border">
                    <ScrollArea className="h-[60vh]">
                      <ul className="divide-y">
                        {poSearching && (
                          <li className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Searching…
                          </li>
                        )}
                        {!poSearching &&
                          poResults.map((po) => (
                            <li
                              key={po.id}
                              className="cursor-pointer px-4 py-3 transition hover:bg-slate-50"
                              onClick={() => choosePO(po)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="text-[15px] font-medium">{po.poNumber}</div>
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
              <div className="mt-2 text-[15px] text-slate-600">
                Supplier: <span className="font-semibold">{selectedPO.supplier}</span>
              </div>
            )}
          </div>

          {/* Summary mini-card */}
          <div className="rounded-2xl border p-4 shadow-sm">
            <div className="flex items-center justify-between text-[15px]">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[15px]">
              <div className="flex items-center gap-2">
                <span className="text-slate-600">Tax</span>
                <Input
                  className="h-9 w-20"
                  type="number"
                  min={0}
                  step="0.5"
                  value={taxPct}
                  onChange={(e) => setTaxPct(Number(e.target.value))}
                  disabled={isLoading}
                />
                <span className="text-slate-600">%</span>
              </div>
              <span className="font-semibold">${tax.toFixed(2)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-lg">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">${amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Lines table */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">Invoice Lines</h3>
            <Button variant="secondary" size="sm" onClick={addRow} disabled={isLoading}>
              <Plus className="mr-2 h-4 w-4" />
              Add Line
            </Button>
          </div>

          <div
            className="
              h-[54vh] overflow-y-auto rounded-2xl border shadow-sm
              scroll-smooth
              [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.300)_transparent]
            "
          >
            <table className="w-full text-[15px]">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur supports-[backdrop-filter]:bg-slate-50/60">
                <tr className="[&>th]:px-4 [&>th]:py-3 text-left text-slate-600">
                  <th className="w-[26rem]">Product</th>
                  <th className="w-32">Unit</th>
                  <th className="w-28">Qty</th>
                  <th className="w-40">Unit Price</th>
                  <th className="w-40 text-right">Line Total</th>
                  <th className="w-12 text-right" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const p = r.productId ? products.find((pp) => pp.productId === r.productId) : undefined;
                  const line = money(r.quantity) * money(r.unitPrice);

                  return (
                    <tr key={idx} className="border-t align-top">
                      <td className="px-4 py-3">
                        {/* fast selector: input + datalist */}
                        <Input
                          list={`inv-products-${idx}`}
                          className="h-11"
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

                      <td className="px-4 py-3">
                        <Input
                          className="h-11"
                          value={r.unit ?? ""}
                          placeholder={p?.unit ?? "e.g. box"}
                          onChange={(e) => updateRow(idx, { unit: e.target.value })}
                          disabled={isLoading}
                        />
                      </td>

                      <td className="px-4 py-3">
                        <Input
                          className="h-11"
                          type="number"
                          min={0}
                          value={r.quantity}
                          onChange={(e) => updateRow(idx, { quantity: Number(e.target.value) })}
                          disabled={isLoading}
                        />
                      </td>

                      <td className="px-4 py-3">
                        <Input
                          className="h-11"
                          type="number"
                          step="0.01"
                          min={0}
                          value={r.unitPrice}
                          onChange={(e) => updateRow(idx, { unitPrice: Number(e.target.value) })}
                          disabled={isLoading}
                        />
                      </td>

                      <td className="px-4 py-3 text-right font-semibold">${line.toFixed(2)}</td>

                      <td className="px-4 py-3 text-right">
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
      </CardContent>

      <CardFooter className="flex items-center justify-end gap-3 p-8 pt-4 md:p-10 md:pt-6">
        <Button variant="outline" onClick={() => window.history.back()} disabled={isLoading}>
          Cancel
        </Button>
        <Button className="h-11 px-6 text-base" onClick={onSubmit} disabled={isLoading || !selectedPO}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating…
            </>
          ) : (
            "Create Invoice"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
