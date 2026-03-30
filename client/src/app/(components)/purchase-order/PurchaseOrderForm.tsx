"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  genPONumber,
  safeNumber,
  type ComboOption,
} from "@/app/(components)/purchase-order/utils/po";
import {
  SupplierSection,
  type SupplierLite,
  type SupplierDraft,
} from "./SupplierSection";
import {
  POItemsTable,
  type ItemRow,
  type DraftProductLite,
} from "./PurchaseOrderTable";
import { POTotalsCard } from "./POTotalCards";
import {
  useGetPurchaseOrdersQuery,
  useGetDraftProductsQuery,
  useCreateDraftProductMutation,
  PurchaseOrderDTO,
  NewPurchaseOrderDTO,
} from "@/app/state/api";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDownIcon } from "lucide-react";

/**
 * The data structure we send to the backend when creating/updating a PO
 */
export type PurchaseOrderFormPayload = NewPurchaseOrderDTO;

type PurchaseOrderFormProps = {
  mode: "create" | "edit";
  initial?: PurchaseOrderDTO;
  onSubmit: (data: PurchaseOrderFormPayload) => Promise<void>;
  submitting?: boolean;
};

export default function PurchaseOrderForm({
  mode,
  initial,
  submitting = false,
  onSubmit,
}: PurchaseOrderFormProps) {
  const router = useRouter();

  const [orderDateOpen, setOrderDateOpen] = React.useState(false);
  const [dueDateOpen, setDueDateOpen] = React.useState(false);

  const [poNumber, setPoNumber] = React.useState(
    mode === "edit" && initial ? initial.poNumber : genPONumber()
  );

  const [orderDate, setOrderDate] = React.useState<Date>(
    mode === "edit" && initial?.orderDate
      ? new Date(initial.orderDate)
      : new Date()
  );

  const [dueDate, setDueDate] = React.useState<Date | undefined>(
    mode === "edit" && initial?.dueDate
      ? new Date(initial.dueDate)
      : undefined
  );

  const [notes, setNotes] = React.useState(
    mode === "edit" && initial ? initial.notes || "" : ""
  );

  const [supplierDraft, setSupplierDraft] = React.useState<SupplierDraft>(() => {
    if (mode === "edit" && initial?.supplier) {
      const supplier = initial.supplier;

      if (supplier.supplierId) {
        return {
          mode: "existing",
          supplierId: supplier.supplierId,
          name: supplier.name || "",
          phone: String(supplier.phone || ""),
          email: supplier.email || "",
          address: supplier.address || "",
        };
      }

      return {
        mode: "new",
        supplierId: "",
        name: supplier.name || "",
        phone: String(supplier.phone || ""),
        email: supplier.email || "",
        address: supplier.address || "",
      };
    }

    return {
      mode: "new",
      supplierId: "",
      name: "",
      phone: "",
      email: "",
      address: "",
    };
  });

  const [taxPercent, setTaxPercent] = React.useState(
    mode === "edit" && initial
      ? (Number(initial.tax) / Number(initial.subtotal || 1)) * 100
      : 0
  );

  const [rows, setRows] = React.useState<ItemRow[]>(() => {
    if (mode === "edit" && initial) {
      return initial.items.map((item) => ({
        name: item.name || "",
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice || 0),
        unit: item.unit || "",
        draftProductId: item.productId || "",
      }));
    }

    return [
      {
        name: "",
        quantity: 1,
        unitPrice: 0,
        unit: "",
        draftProductId: "",
      },
    ];
  });

  const { data: purchaseOrders = [] } = useGetPurchaseOrdersQuery(undefined);
  const { data: draftProducts = [] } = useGetDraftProductsQuery(undefined);
  const [createDraftProduct] = useCreateDraftProductMutation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const suppliers: SupplierLite[] = React.useMemo(() => {
    const map = new Map<string, SupplierLite>();

    for (const po of purchaseOrders as any[]) {
      const s = po?.supplier;
      if (!s || typeof s === "string") continue;

      if (s.supplierId && !map.has(s.supplierId)) {
        map.set(s.supplierId, {
          supplierId: s.supplierId,
          name: s.name,
          email: s.email || "",
          phone: s.phone || "",
          address: s.address || "",
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [purchaseOrders]);

  const supplierOptions: ComboOption[] = React.useMemo(
    () => suppliers.map((s) => ({ value: s.supplierId, label: s.name })),
    [suppliers]
  );

  const drafts: DraftProductLite[] = React.useMemo(() => {
    return (draftProducts as any[]).map((d) => ({
      id: d.id,
      name: d.name,
      unit: d.unit || "",
    }));
  }, [draftProducts]);

  const baseDraftOptions: ComboOption[] = React.useMemo(
    () => drafts.map((d) => ({ value: d.id, label: d.name })),
    [drafts]
  );

  const [localDraftOptions, setLocalDraftOptions] = React.useState<ComboOption[]>(
    []
  );

  const draftOptions = React.useMemo(() => {
    const map = new Map<string, ComboOption>();
    for (const opt of [...localDraftOptions, ...baseDraftOptions]) {
      map.set(opt.value, opt);
    }
    return Array.from(map.values());
  }, [localDraftOptions, baseDraftOptions]);

  const onCreateDraft = React.useCallback(
    async (label: string): Promise<ComboOption> => {
      const name = label.trim();
      if (!name) return { value: "", label: "" };

      const unit = (window.prompt("Unit (optional) e.g. box, each") || "").trim();
      const created = await createDraftProduct({ name, unit }).unwrap();

      const opt: ComboOption = { value: created.id, label: created.name };
      setLocalDraftOptions((prev) => [opt, ...prev]);

      return opt;
    },
    [createDraftProduct]
  );

  const subtotal = React.useMemo(
    () =>
      rows.reduce(
        (sum, row) => sum + safeNumber(row.quantity) * safeNumber(row.unitPrice),
        0
      ),
    [rows]
  );

  const tax = subtotal * (safeNumber(taxPercent) / 100);
  const total = subtotal + tax;

  const reset = React.useCallback(() => {
    setPoNumber(genPONumber());
    setOrderDate(new Date());
    setDueDate(undefined);
    setNotes("");
    setTaxPercent(0);
    setRows([
      {
        quantity: 1,
        unitPrice: 0,
        unit: "",
        name: "",
        draftProductId: "",
      },
    ]);
    setSupplierDraft({
      mode: "new",
      supplierId: "",
      name: "",
      email: "",
      phone: "",
      address: "",
    });
  }, []);

  function validate(): boolean {
    if (supplierDraft.mode === "existing") {
      if (!supplierDraft.supplierId) {
        toast.error("Select a supplier or create a new one");
        return false;
      }
    } else {
      if (!supplierDraft.name.trim()) {
        toast.error("Supplier Name is required");
        return false;
      }
    }

    if (!rows.length) {
      toast.error("Add at least one item");
      return false;
    }

    if (rows.some((r) => !r.draftProductId || safeNumber(r.quantity) <= 0)) {
      toast.error("Each item must have a product and quantity > 0");
      return false;
    }

    return true;
  }

  const handleSubmit = React.useCallback(async () => {
    if (isSubmitting || submitting) return;
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const items = rows.map((r) => {
        const quantity = safeNumber(r.quantity);
        const unitPrice = safeNumber(r.unitPrice);

        return {
          productId: r.productId ?? r.draftProductId,
          draftProductId: r.draftProductId,
          name: (r.name || "").trim(),
          unit: (r.unit || "").trim(),
          quantity,
          unitPrice,
          lineTotal: quantity * unitPrice,
        };
      });

      const base: NewPurchaseOrderDTO = {
        poNumber,
        orderDate: orderDate.toISOString(),
        dueDate: dueDate ? dueDate.toISOString() : undefined,
        notes: notes || undefined,
        items,
        subtotal,
        status: initial?.status || "DRAFT",
        tax,
        total,
      };

      let payload: PurchaseOrderFormPayload;

      if (supplierDraft.mode === "existing") {
        payload = {
          ...base,
          supplierId: supplierDraft.supplierId,
        };
      } else {
        payload = {
          ...base,
          supplier: {
            name: supplierDraft.name.trim(),
            email: supplierDraft.email?.trim() || "",
            phone: supplierDraft.phone?.trim() || "",
            address: supplierDraft.address?.trim() || "",
          },
        };
      }

      await onSubmit(payload);

      if (mode === "create") {
        reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    submitting,
    rows,
    poNumber,
    orderDate,
    dueDate,
    notes,
    subtotal,
    tax,
    total,
    supplierDraft,
    onSubmit,
    initial,
    mode,
    reset,
  ]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
          {mode === "create" ? "Create " : "Edit "}Purchase Order
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
          {mode === "create"
            ? "Create a new purchase order using draft products."
            : "Update the purchase order details below."}
        </p>
      </div>

      {/* Supplier */}
      <SupplierSection
        suppliers={suppliers}
        supplierOptions={supplierOptions}
        value={supplierDraft}
        onChange={setSupplierDraft}
        disabled={submitting || isSubmitting}
      />

      {/* Items */}
      <div className="overflow-hidden rounded-2xl">
        <POItemsTable
          rows={rows}
          onChange={setRows}
          drafts={drafts}
          draftOptions={draftOptions}
          onCreateDraft={onCreateDraft}
          disabled={submitting || isSubmitting}
        />
      </div>

      {/* Metadata + totals */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-5 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-6">
          <div>
            <Label className="text-sm font-medium text-foreground">PO Number</Label>
            <Input
              className="mt-2 h-11 text-base"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              disabled={submitting || isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-2">
              <Label htmlFor="order-date" className="text-sm font-medium text-foreground">
                Order Date
              </Label>
              <Popover open={orderDateOpen} onOpenChange={setOrderDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="order-date"
                    className="h-11 w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {orderDate ? orderDate.toLocaleDateString() : "Select an order date"}
                    </span>
                    <ChevronDownIcon className="h-4 w-4 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto overflow-hidden border border-border/60 bg-popover p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={orderDate}
                    captionLayout="dropdown"
                    onSelect={(d) => {
                      if (d) setOrderDate(d);
                      setOrderDateOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              <Label htmlFor="due-date" className="text-sm font-medium text-foreground">
                Due Date
              </Label>
              <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="due-date"
                    className="h-11 w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {dueDate ? dueDate.toLocaleDateString() : "Select a due date"}
                    </span>
                    <ChevronDownIcon className="h-4 w-4 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto overflow-hidden border border-border/60 bg-popover p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    captionLayout="dropdown"
                    onSelect={(d) => {
                      setDueDate(d);
                      setDueDateOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-foreground">
              Notes / Terms
            </Label>
            <Textarea
              className="mt-2 min-h-[120px] resize-none text-base"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any special notes or payment terms..."
              disabled={submitting || isSubmitting}
            />
          </div>
        </div>

        <div className="min-w-0">
          <POTotalsCard
            subtotal={subtotal}
            taxPercent={taxPercent}
            onTaxPercentChange={setTaxPercent}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          variant="outline"
          type="button"
          onClick={() => router.back()}
          disabled={submitting || isSubmitting}
          className="h-11 w-full px-6 text-base sm:w-auto"
        >
          Cancel
        </Button>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || isSubmitting}
          className="h-11 w-full px-8 text-base sm:w-auto"
        >
          {submitting || isSubmitting
            ? mode === "create"
              ? "Creating Purchase Order..."
              : "Saving Changes..."
            : mode === "create"
            ? "Create Purchase Order"
            : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}