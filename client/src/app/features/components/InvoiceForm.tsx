// client/src/app/features/components/invoiceeform.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { Loader2 } from "lucide-react";

import {
  SupplierInvoiceDTO,
  CreateSupplierInvoiceDTO,
  InvoiceLine,
  PurchaseOrderDTO,
  useGetPurchaseOrdersQuery,
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

/**
 * Props for the InvoiceForm component
 */
type InvoiceFormProps = {
  /** Whether we're creating a new invoice or editing an existing one */
  mode: "create" | "edit";

  /** The existing invoice data (only used when mode is "edit") */
  initial?: SupplierInvoiceDTO;

  /** Linked Purchase order tied to the created invoice */
  linkedPO?: PurchaseOrderDTO | null;

  /** Function called when user submits the form */
  onSubmit: (data: SupplierInvoiceFormPayload) => Promise<void>;

  /** Whether the form is currently being submitted */
  submitting?: boolean;

  /** Optional callback for successful creation (create mode only) */
  onSuccess?: (invoiceNumber: string) => void;
};

function toYMD(d: Date): string {
  // YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}

/**
 * InvoiceForm - A form for creating or editing supplier invoices
 *
 * Pattern used:
 * - UI uses Date | undefined for calendar pickers
 * - Payload converts Date -> "YYYY-MM-DD" right before submit
 */
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

  // ✅ UI state is Date-based for shadcn Calendar
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

  const searchActive = poSearch.trim().length > 0;

  const { data: poResults = [], isFetching: poSearching } = useGetPurchaseOrdersQuery(
    searchActive ? { q: poSearch } : undefined,
    { refetchOnMountOrArgChange: true }
  );

  const { data: allPOResults = [] } = useListPurchaseOrderQuery();

  // Show searched results if searching, otherwise show all
  const basePOs = searchActive ? poResults : allPOResults;
  const eligiblePOs = React.useMemo(
    () => basePOs.filter((po) => (po.invoiceCount ?? 0) === 0),
    [basePOs]
  );

  // ========================================
  // PRODUCTS (Draft Products)
  // ========================================

  const { data } = useGetDraftProductsQuery();
  const productDrafts = data ?? [];
  const productIndex = useProductIndex(productDrafts);

  // ========================================
  // LINE ITEMS
  // ========================================

  const [rows, setRows] = React.useState<LineRow[]>(() => {
    if (mode === "edit" && initial?.lines) {
      return initial.lines.map((line) => ({
        id: crypto.randomUUID(),
        poItemId: undefined,
        productId: line.draftProductId || "",
        name: line.name || "",
        unit: line.unit || "",
        quantity: line.quantity || 1,
        unitPrice: line.unitPrice || 0,
      }));
    }
    return [makeEmptyRow()];
  });

  const [taxPct, setTaxPct] = React.useState<number>(0);

  const [poTax, setPoTax] = React.useState<number>(
    mode === "edit" && initial
      ? Number(initial.amount ?? 0) -
          Number(
            initial.lines?.reduce((s, l) => s + (l.lineTotal ?? 0), 0) ?? 0
          )
      : 0
  );

  // ========================================
  // PREVENT DOUBLE SUBMISSION
  // ========================================

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // ========================================
  // INITIALIZE SELECTED PO FOR EDIT MODE
  // ========================================

  React.useEffect(() => {
    if (mode === "edit" && linkedPO && !selectedPO) {
      setSelectedPO(linkedPO);
    }
  }, [mode, linkedPO, selectedPO]);

  // ========================================
  // PO SELECTION HANDLER
  // ========================================

  const choosePO = React.useCallback(
    (po: PurchaseOrderDTO) => {
      setSelectedPO(po);
      setPoTax(po.tax ?? 0);

      const seeded: LineRow[] = (po.items ?? []).map((it: any) => {
        const draft = productIndex.byId.get(it.productId); // DraftProduct from cache

        return {
          id: crypto.randomUUID(),
          poItemId: it.id,
          productId: it.productId,

          // ✅ reliable name + unit fallbacks
          name: it.product?.name ?? draft?.name ?? it.description ?? it.name ?? "",
          unit: it.unit ?? it.product?.unit ?? draft?.unit ?? "",

          quantity: it.quantity ?? 1,
          unitPrice: Number(it.unitPrice ?? 0),
        };
      });

      setRows(seeded.length ? seeded : [makeEmptyRow()]);
    },
    [productIndex]
  );

  const onClearPO = () => {
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
  };

  // ========================================
  // LINE ITEM HANDLERS
  // ========================================

  const addRow = React.useCallback(() => setRows((prev) => [...prev, makeEmptyRow()]), []);

  const patchRow = React.useCallback((rowId: string, patch: Partial<LineRow>) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r)));
  }, []);

  const removeRow = React.useCallback((rowId: string) => {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  }, []);

  // ========================================
  // CALCULATIONS
  // ========================================

  const subtotal = React.useMemo(
    () => rows.reduce((s, r) => s + money(r.quantity) * money(r.unitPrice), 0),
    [rows]
  );

  const tax = React.useMemo(() => subtotal * (money(taxPct) / 100), [subtotal, taxPct]);

  const amount = React.useMemo(() => subtotal + tax, [subtotal, tax]);

  // ========================================
  // RESET FORM (CREATE MODE ONLY)
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

    if (!rows.length || rows.some((r) => !r.productId || r.quantity <= 0)) {
      toast({
        variant: "destructive",
        title: "Add at least one valid line (product + quantity)",
      });
      return false;
    }

    if (!date) {
      toast({ variant: "destructive", title: "Invoice date is required" });
      return false;
    }

    return true;
  }

  // ========================================
  // FORM SUBMISSION
  // ========================================

  const handleSubmit = React.useCallback(async () => {
    if (isSubmitting || submitting) return;
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const lines: InvoiceLine[] = rows.map((r) => {
        const found = r.productId ? productIndex.byId.get(r.productId) : undefined;

        return {
          draftProductId: r.productId!,
          poItemId: r.poItemId, // ✅ keep link
          productId: null,
          sku: r.productId,
          name: r.name || found?.name || "",
          unit: r.unit || found?.unit || "",
          quantity: Number(r.quantity) || 0,
          unitPrice: Number(r.unitPrice) || 0,
          lineTotal: (Number(r.quantity) || 0) * (Number(r.unitPrice) || 0),
        };
      });

      const payload: SupplierInvoiceFormPayload = {
        invoiceNumber,
        supplierId: activePO?.supplierId ?? initial?.supplierId ?? "",
        poId: activePO?.id ?? initial?.poId ?? "",

        // ✅ convert Date -> string for backend
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

  return (
    <Card className="relative rounded-3xl border-slate-200 bg-white/95 shadow-xl ring-1 ring-black/5">
      {(submitting || isSubmitting) && (
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
          disabled={submitting || isSubmitting}
        />

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <PurchaseOrderPicker
            poSearch={poSearch}
            setPoSearch={setPoSearch}
            poSearching={poSearching}
            displayedPOs={eligiblePOs}
            selectedPO={activePO}
            onChoosePO={choosePO}
            disabled={submitting || isSubmitting || mode === "edit"}
            onClearPO={onClearPO}
          />

          <InvoiceSummaryCard
            subtotal={subtotal}
            taxPct={taxPct}
            tax={tax}
            amount={amount}
            disabled={submitting || isSubmitting}
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
          disabled={submitting || isSubmitting}
        />
      </CardContent>

      <CardFooter className="flex items-center justify-end gap-3 p-8 pt-4 md:p-10 md:pt-6">
        <Button variant="outline" onClick={() => router.back()} disabled={submitting || isSubmitting}>
          Cancel
        </Button>

        <Button
          type="button"
          className="h-11 px-6 text-base"
          onClick={handleSubmit}
          disabled={submitting || isSubmitting || !activePOId}
        >
          {submitting || isSubmitting ? (
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
