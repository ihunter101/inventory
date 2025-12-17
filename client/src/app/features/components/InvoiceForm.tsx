"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";

import {
  useGetPurchaseOrdersQuery,
  useCreateSupplierInvoiceMutation,
  useGetProductsQuery,
  SupplierInvoiceDTO,
  InvoiceLine,
  PurchaseOrderDTO,
  useListPurchaseOrderQuery,
  useGetDraftProductsQuery,
  useGetPurchaseOrderQuery,
} from "@/app/state/api";

import type { InvoiceFormProps, LineRow } from "@/app/features/lib/types";
import { genInvoiceNumber, makeEmptyRow, money } from "@/app/features/lib/helper";
import { useProductIndex } from "@/app/features/lib/useProductIndex";

import InvoiceMetaFields from "@/app/(components)/invoices/InvoiceMetaFields";
import PurchaseOrderPicker from "@/app/(components)/invoices/PurchaseOrderPicker";
import InvoiceSummaryCard from "@/app/(components)/invoices/InvoiceSummaryCard";
import InvoiceLinesSection from "@/app/(components)/invoices/InvoiceLineSection";

export default function InvoiceForm({ onSuccess }: InvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  // ----- PO search + selection -----
  const [poSearch, setPoSearch] = React.useState("");
  const [selectedPO, setSelectedPO] = React.useState<PurchaseOrderDTO | null>(null);

  const searchActive = poSearch.trim().length > 0;

  const { data: poResults = [], isFetching: poSearching } =
    useGetPurchaseOrdersQuery(searchActive ? { q: poSearch } : undefined, {
      refetchOnMountOrArgChange: true,
    });

  const { data: allPOResults = [] } = useListPurchaseOrderQuery();

  // ✅ show searched results if searching, otherwise show all
  const basePOs = searchActive ? poResults : allPOResults;
  const eligiblePOs = React.useMemo(
    () => basePOs.filter((po) => (po.invoiceCount ?? 0) === 0),
    [basePOs]
  );

  // ----- products -----
  const { data } = useGetDraftProductsQuery();
  const productDrafts = data ?? [];
  const productIndex = useProductIndex(productDrafts);

  // ----- invoice meta -----
  const [invoiceNumber, setInvoiceNumber] = React.useState(genInvoiceNumber());
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = React.useState("");

  // ----- lines -----
  const [rows, setRows] = React.useState<LineRow[]>([]);
  const [taxPct, setTaxPct] = React.useState<number>(0);
  const [poTax, setPoTax] = React.useState<number>(0);

  // ----- mutation -----
  const [createInvoice, { isLoading }] = useCreateSupplierInvoiceMutation();

  const choosePO = React.useCallback((po: PurchaseOrderDTO) => {
    setSelectedPO(po);
    setPoTax(po.tax ?? 0);

    const seeded: LineRow[] = (po.items ?? []).map((it) => ({
      id: crypto.randomUUID(),
      productId: it.productId,
      name: it.name ?? "",
      unit: it.unit ?? "",
      quantity: it.quantity ?? 1,
      unitPrice: it.unitPrice ?? 0,
    }));

    setRows(seeded.length ? seeded : [makeEmptyRow()]);
  }, []);

  const onClearPO = () => {
    setSelectedPO(null);
    setPoSearch("")
    setRows([]);
    setPoTax(0);  
  };

  const addRow = React.useCallback(() => setRows((prev) => [...prev, makeEmptyRow()]), []);
  const patchRow = React.useCallback((rowId: string, patch: Partial<LineRow>) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r)));
  }, []);
  const removeRow = React.useCallback((rowId: string) => {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  }, []);

  const subtotal = React.useMemo(
    () => rows.reduce((s, r) => s + money(r.quantity) * money(r.unitPrice), 0),
    [rows]
  );
  const tax = React.useMemo(() => subtotal * (money(taxPct) / 100), [subtotal, taxPct]);
  const amount = React.useMemo(() => subtotal + tax, [subtotal, tax]);

  const onSubmit = React.useCallback(async () => {
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
      const found = r.productId ? productIndex.byId.get(r.productId) : undefined;

      return {
        draftProductId: r.productId!,
        productId: null,
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
        date,
        dueDate: dueDate || undefined,
        status: "PENDING",
        amount,
        lines,
      };

  
      console.log("LINES TYPE:", Array.isArray(lines), lines);

      await createInvoice(body).unwrap();


      toast({ title: "Invoice created", description: invoiceNumber });
      onSuccess?.(invoiceNumber);

      // reset
      setInvoiceNumber(genInvoiceNumber());
      setDate(new Date().toISOString().slice(0, 10));
      setDueDate("");
      setRows([]);
      //setTaxPct(0);
      setSelectedPO(null);
      setPoSearch("");
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Failed to create invoice",
        description: e?.data?.message || "Please try again.",
      });
    }
  }, [
    selectedPO,
    rows,
    toast,
    productIndex,
    invoiceNumber,
    date,
    dueDate,
    amount,
    createInvoice,
    onSuccess,
  ]);

  return (
    <Card className="relative rounded-3xl border-slate-200 bg-white/95 shadow-xl ring-1 ring-black/5">
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
        <InvoiceMetaFields
          invoiceNumber={invoiceNumber}
          setInvoiceNumber={setInvoiceNumber}
          date={date}
          setDate={setDate}
          dueDate={dueDate}
          setDueDate={setDueDate}
          disabled={isLoading}
        />

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <PurchaseOrderPicker
            poSearch={poSearch}
            setPoSearch={setPoSearch}
            poSearching={poSearching}
            displayedPOs={eligiblePOs}
            selectedPO={selectedPO}
            onChoosePO={choosePO}
            disabled={isLoading}
            onClearPO={onClearPO}
          />

          <InvoiceSummaryCard
            subtotal={subtotal}
            taxPct={taxPct}
            //setTaxPct={setTaxPct}
            tax={tax}
            amount={amount}
            disabled={isLoading}
            poTax={poTax}
          />
        </div>

        <InvoiceLinesSection
          rows={rows}
          productDrafts={productDrafts}
          productIndex={productIndex}
          onAddRow={addRow}
          onPatchRow={patchRow}
          onRemoveRow={removeRow}
          disabled={isLoading}
        />
      </CardContent>

      <CardFooter className="flex items-center justify-end gap-3 p-8 pt-4 md:p-10 md:pt-6">
        <Button variant="outline" onClick={() => router.back()} disabled={isLoading}>
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
