// client/src/app/features/components/InvoiceForm.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/toaster";

import {
  SupplierInvoiceDTO,
  CreateSupplierInvoiceDTO,
  PurchaseOrderDTO,
  useListPurchaseOrderQuery,
  useGetDraftProductsQuery,
} from "@/app/state/api";

import type { LineRow } from "@/app/features/lib/types";
import { genInvoiceNumber, makeEmptyRow, money } from "@/app/features/lib/helper";
import { useProductIndex } from "@/app/features/lib/useProductIndex";

import InvoiceMetaFields from "@/app/(components)/invoices/InvoiceMetaFields";
import PurchaseOrderPicker from "@/app/(components)/invoices/PurchaseOrderPicker";
import InvoiceSummaryCard from "@/app/(components)/invoices/InvoiceSummaryCard";
import InvoiceLinesSection from "@/app/(components)/invoices/InvoiceLineSection";

/**
 * The data structure we send to the backend when creating/updating an invoice
 */
export type SupplierInvoiceFormPayload = CreateSupplierInvoiceDTO;

type InvoiceFormProps = {
  mode: "create" | "edit";
  initial?: SupplierInvoiceDTO;
  linkedPO?: PurchaseOrderDTO | null;
  onSubmit: (data: SupplierInvoiceFormPayload) => Promise<void>;
  submitting?: boolean;
  onSuccess?: (invoiceNumber: string) => void;
};

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function InvoiceForm({
  mode,
  initial,
  onSubmit,
  submitting = false,
  onSuccess,
  linkedPO = null,
}: InvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  // ========================================
  // FORM STATE
  // ========================================

  const [invoiceNumber, setInvoiceNumber] = React.useState(
    mode === "edit" && initial ? initial.invoiceNumber : genInvoiceNumber()
  );

  const [date, setDate] = React.useState<Date | undefined>(
    mode === "edit" && initial?.date ? new Date(initial.date) : new Date()
  );

  const [dueDate, setDueDate] = React.useState<Date | undefined>(
    mode === "edit" && initial?.dueDate ? new Date(initial.dueDate) : undefined
  );

  // ========================================
  // PO SEARCH + SELECTION
  // ========================================

  const [poSearch, setPoSearch] = React.useState("");
  const [selectedPO, setSelectedPO] = React.useState<PurchaseOrderDTO | null>(null);

  const activePO = selectedPO ?? linkedPO ?? null;
  const activePOId = activePO?.id ?? initial?.poId ?? null;

  // Use server list (supports ?q=)
  const searchActive = poSearch.trim().length > 0;
  const { data: allPOs = [], isFetching: poSearching } = useListPurchaseOrderQuery(
    searchActive ? { q: poSearch } : undefined
  );

  // ✅ IMPORTANT: Eligibility is item-based, not invoiceCount-based.
  // Show PO if ANY item still has remainingToInvoice > 0
  const eligiblePOs = React.useMemo(() => {
    return (allPOs as PurchaseOrderDTO[]).filter((po) =>
      (po.items ?? []).some((it: any) => (it.remainingToInvoice ?? 0) > 0)
    );
  }, [allPOs]);

  // If you want additional local filtering (PO number / supplier) you can keep it,
  // but since server already searches by q, this is optional.
  const displayedPOs = React.useMemo(() => {
    const q = poSearch.trim().toLowerCase();
    if (!q) return eligiblePOs;

    return eligiblePOs.filter((po) => {
      const poNum = (po.poNumber ?? "").toLowerCase();
      const supplier = (po.supplier?.name ?? "").toLowerCase();
      return poNum.includes(q) || supplier.includes(q);
    });
  }, [eligiblePOs, poSearch]);

  // ========================================
  // PRODUCTS (Draft Products)
  // ========================================

  const { data: draftsData } = useGetDraftProductsQuery();
  const productDrafts = draftsData ?? [];
  const productIndex = useProductIndex(productDrafts);

  // ========================================
  // LINE ITEMS
  // ========================================

  const [rows, setRows] = React.useState<LineRow[]>(() => {
    if (mode === "edit" && initial?.lines?.length) {
      return initial.lines.map((line) => ({
        id: crypto.randomUUID(),
        poItemId: line.poItemId,
        // In your UI, row.productId is the *draft product id*
        productId: line.draftProductId || "",
        name: line.name || "",
        unit: line.unit || "",
        quantity: line.quantity || 1,
        unitPrice: line.unitPrice || 0,
      }));
    }
    return [makeEmptyRow()];
  });

  // You’re showing PO tax in the summary card; keep it read-only there.
  const [poTax, setPoTax] = React.useState<number>(() => {
    if (mode === "edit" && initial) return 0;
    return 0;
  });

  // Optional “manual tax%” if you later want it; not used for payload right now.
  const [taxPct] = React.useState<number>(0);

  // ========================================
  // PREVENT DOUBLE SUBMISSION
  // ========================================

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // ========================================
  // INIT SELECTED PO IN EDIT MODE
  // ========================================

  React.useEffect(() => {
    if (mode === "edit" && linkedPO && !selectedPO) {
      setSelectedPO(linkedPO);
      setPoTax(Number(linkedPO.tax ?? 0));
    }
  }, [mode, linkedPO, selectedPO]);

  // ========================================
  // PO SELECTION HANDLER
  // ========================================

  const choosePO = React.useCallback(
    (po: PurchaseOrderDTO) => {
      setSelectedPO(po);
      setPoTax(Number(po.tax ?? 0));

      // ✅ Only seed items that still have remainingToInvoice > 0
      // ✅ Default invoice quantity to remainingToInvoice (not full PO quantity)
      const seeded: LineRow[] = (po.items ?? [])
  .filter((it: any) => (it.remainingToInvoice ?? 0) > 0)
  .map((it: any) => {
    const draft = productIndex.byId.get(it.draftProductId ?? it.productId);

    return {
      id: crypto.randomUUID(),
      poItemId: it.id,
      productId: it.draftProductId ?? it.productId,

      name: it.name ?? it.product?.name ?? draft?.name ?? "",
      unit: it.unit ?? it.product?.unit ?? draft?.unit ?? "",

      // ✅ default quantity to what remains to invoice
      quantity: it.remainingToInvoice ?? 1,
      unitPrice: Number(it.unitPrice ?? 0),
    };
  });

setRows(seeded.length ? seeded : [makeEmptyRow()]);

    },
    [productIndex]
  );

  const onClearPO = React.useCallback(() => {
    if (mode === "edit") {
      toast({
        variant: "destructive",
        title: "Cannot change PO in edit mode",
      });
      return;
    }
    setSelectedPO(null);
    setPoSearch("");
    setRows([makeEmptyRow()]);
    setPoTax(0);
  }, [mode, toast]);

  // ========================================
  // LINE ITEM HANDLERS
  // ========================================

  const addRow = React.useCallback(() => {
    setRows((prev) => [...prev, makeEmptyRow()]);
  }, []);

  const patchRow = React.useCallback((rowId: string, patch: Partial<LineRow>) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r)));
  }, []);

  const removeRow = React.useCallback((rowId: string) => {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  }, []);

  // ========================================
  // CALCULATIONS (UI only)
  // ========================================

  const subtotal = React.useMemo(
    () => rows.reduce((s, r) => s + money(r.quantity) * money(r.unitPrice), 0),
    [rows]
  );

  // If you want to show PO tax as amount, use poTax directly.
  // If you want tax% math later, re-enable it here.
  const tax = React.useMemo(() => Number(poTax ?? 0), [poTax]);

  const amount = React.useMemo(() => subtotal + tax, [subtotal, tax]);

  // ========================================
  // RESET (CREATE MODE)
  // ========================================

  const reset = React.useCallback(() => {
    setInvoiceNumber(genInvoiceNumber());
    setDate(new Date());
    setDueDate(undefined);
    setRows([makeEmptyRow()]);
    setSelectedPO(null);
    setPoSearch("");
    setPoTax(0);
  }, []);

  // ========================================
  // VALIDATION
  // ========================================

  function validate(): boolean {
    if (!activePOId) {
      toast({
        variant: "destructive",
        title: mode === "edit" ? "No PO linked" : "Select a PO first",
      });
      return false;
    }

    if (!date) {
      toast({ variant: "destructive", title: "Invoice date is required" });
      return false;
    }

    if (!rows.length) {
      toast({
        variant: "destructive",
        title: "Add at least one line item",
      });
      return false;
    }

    // Each row must have a draftProductId + quantity > 0
    if (rows.some((r) => !r.productId || Number(r.quantity) <= 0)) {
      toast({
        variant: "destructive",
        title: "Each line needs a product and quantity > 0",
      });
      return false;
    }

    return true;
  }

  // ========================================
  // SUBMIT
  // ========================================

  const handleSubmit = React.useCallback(async () => {
    if (isSubmitting || submitting) return;
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // ✅ Build payload lines to match CreateSupplierInvoiceDTO EXACTLY
      const lines: CreateSupplierInvoiceDTO["lines"] = rows.map((r) => {
        const found = r.productId ? productIndex.byId.get(r.productId) : undefined;

        return {
          draftProductId: r.productId!, // required by DTO
          poItemId: r.poItemId,
          unit: (r.unit || found?.unit || "").trim(),
          quantity: Number(r.quantity) || 0,
          unitPrice: Number(r.unitPrice) || 0,
          // description: optional — you can include if you want:
          // description: (r.name || found?.name || "").trim(),
        };
      });

      const payload: SupplierInvoiceFormPayload = {
        invoiceNumber,
        supplierId: activePO?.supplierId ?? initial?.supplierId ?? "",
        poId: activePO?.id ?? initial?.poId ?? undefined,
        date: date ? toYMD(date) : toYMD(new Date()),
        dueDate: dueDate ? toYMD(dueDate) : undefined,
        lines,
      };

      await onSubmit(payload);

      toast({
        title: mode === "create" ? "Invoice created" : "Invoice updated",
        description: invoiceNumber,
      });

      if (mode === "create") {
        onSuccess?.(invoiceNumber);
        reset();
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: mode === "create" ? "Failed to create invoice" : "Failed to update invoice",
        description: e?.data?.message || "Please try again.",
      });
      throw e; // keeps your caller behavior consistent
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    submitting,
    rows,
    productIndex,
    invoiceNumber,
    date,
    dueDate,
    activePO,
    initial,
    mode,
    onSubmit,
    onSuccess,
    reset,
    toast,
    activePOId,
  ]);

  // ========================================
  // RENDER
  // ========================================

  const busy = submitting || isSubmitting;

  return (
    <Card className="relative rounded-3xl border-slate-200 bg-white/95 shadow-xl ring-1 ring-black/5">
      {busy && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-white/70 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-base">
              {mode === "create" ? "Creating invoice…" : "Updating invoice…"}
            </span>
          </div>
        </div>
      )}

      <CardHeader className="gap-2 p-8 pb-4 md:p-10 md:pb-6">
        <CardTitle className="text-3xl font-semibold tracking-tight text-slate-900">
          {mode === "create" ? "Create " : "Edit "}Supplier Invoice
        </CardTitle>
        <CardDescription className="text-[15px] text-slate-500">
          {mode === "create"
            ? "Find a purchase order; we'll capture the supplier and you can refine the lines."
            : "Update the invoice details below."}
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
          disabled={busy}
        />

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <PurchaseOrderPicker
            poSearch={poSearch}
            setPoSearch={setPoSearch}
            poSearching={poSearching}
            displayedPOs={displayedPOs}   // ✅ this is the correct list
            selectedPO={activePO}
            onChoosePO={choosePO}
            disabled={busy || mode === "edit"}
            onClearPO={onClearPO}
          />

          <InvoiceSummaryCard
            subtotal={subtotal}
            taxPct={taxPct}
            poTax={tax}
            tax={tax}
            amount={amount}
            disabled={busy}
          />
        </div>

        <InvoiceLinesSection
          rows={rows}
          productDrafts={productDrafts}
          productIndex={productIndex}
          onAddRow={addRow}
          onPatchRow={patchRow}
          onRemoveRow={removeRow}
          disabled={busy}
        />
      </CardContent>

      <CardFooter className="flex items-center justify-end gap-3 p-8 pt-4 md:p-10 md:pt-6">
        <Button variant="outline" onClick={() => router.back()} disabled={busy}>
          Cancel
        </Button>

        <Button
          type="button"
          className="h-11 px-6 text-base"
          onClick={handleSubmit}
          disabled={busy || !activePOId}
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === "create" ? "Creating…" : "Saving…"}
            </>
          ) : mode === "create" ? (
            "Create Invoice"
          ) : (
            "Save Changes"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
