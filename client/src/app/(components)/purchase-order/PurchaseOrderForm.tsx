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
  todayYMD,
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
  useCreatePurchaseOrderMutation,
  useGetDraftProductsQuery,
  useCreateDraftProductMutation,
  PurchaseOrderDTO,
  NewPurchaseOrderDTO,
} from "@/app/state/api";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDownIcon } from "lucide-react";

/**
 * The data structure we send to the backend when creating/updating a PO
 */
export type PurchaseOrderFormPayload = NewPurchaseOrderDTO;

/**
 * Props for the PurchaseOrderForm component
 */
type PurchaseOrderFormProps = {
  /** Whether we're creating a new PO or editing an existing one */
  mode: "create" | "edit";
  
  /** The existing PO data (only used when mode is "edit") */
  initial?: PurchaseOrderDTO;
  
  /** Function called when user submits the form */
  onSubmit: (data: PurchaseOrderFormPayload) => Promise<void>;
  
  /** Whether the form is currently being submitted */
  submitting?: boolean;
};

/**
 * PurchaseOrderForm - A form for creating or editing purchase orders
 * 
 * Features:
 * - Select existing supplier or create new one
 * - Add/remove line items with draft products
 * - Calculate subtotal, tax, and total automatically
 * - Validates all required fields before submission
 * 
 * @example
 * ```tsx
 * <PurchaseOrderForm
 *   mode="create"
 *   onSubmit={handleCreate}
 *   submitting={isLoading}
 * />
 * ```
 */
export default function PurchaseOrderForm({
  mode,
  initial,
  submitting = false,
  onSubmit,
}: PurchaseOrderFormProps) {
  const router = useRouter();

  // ========================================
  // FORM STATE - These hold all the form data
  // ========================================
  
  const [open, setOpen] = React.useState(false)
  /** The PO number (e.g., "PO-2024-001") */
  const [poNumber, setPoNumber] = React.useState(
    mode === "edit" && initial ? initial.poNumber : genPONumber()
  );

  /** When the PO was created (YYYY-MM-DD format) */
const [orderDate, setOrderDate] = React.useState<Date>(
  mode === "edit" && initial?.orderDate ? new Date(initial.orderDate) : new Date()
);
/** When the PO was created (YYYY-MM-DD format) */
const [dueDate, setDueDate] = React.useState<Date | undefined>(
  mode === "edit" && initial?.dueDate ? new Date(initial.dueDate) : undefined
);


  /** Any special notes or terms for this PO */
  const [notes, setNotes] = React.useState(
    mode === "edit" && initial ? initial.notes || "" : ""
  );

  /** 
   * The supplier information - can be either:
   * - Existing supplier (mode: "existing" with supplierId)
   * - New supplier (mode: "new" with all details)
   */
  const [supplierDraft, setSupplierDraft] = React.useState<SupplierDraft>(() => {
    if (mode === "edit" && initial?.supplier) {
      const supplier = initial.supplier;
      
      // If editing an existing supplier
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
      
      // If it was a new supplier when created
      return {
        mode: "new",
        supplierId: "",
        name: supplier.name || "",
        phone: String(supplier.phone || ""),
        email: supplier.email || "",
        address: supplier.address || "",
      };
    }
    
    // Default for new POs
    return {
      mode: "new",
      supplierId: "",
      name: "",
      phone: "",
      email: "",
      address: "",
    };
  });

  /** Tax percentage (e.g., 8.5 for 8.5%) */
  const [taxPercent, setTaxPercent] = React.useState(
    mode === "edit" && initial
      ? (Number(initial.tax) / Number(initial.subtotal || 1)) * 100
      : 0
  );

  /** 
   * The line items in the PO - each row has:
   * - name: product name
   * - quantity: how many units
   * - unitPrice: price per unit
   * - unit: measurement unit (e.g., "box", "each")
   * - draftProductId: the ID of the draft product
   */
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
    // Default empty row for new POs
    return [{ name: "", quantity: 1, unitPrice: 0, unit: "", draftProductId: "" }];
  });
  console.log("Initial Rows: ", rows)
  console.log("Second check for initial Rows: ", rows)

  // ========================================
  // DATA FETCHING - Get suppliers and products from backend
  // ========================================
  
  /** Get all purchase orders (we extract suppliers from these) */
  const { data: purchaseOrders = [] } = useGetPurchaseOrdersQuery(undefined);
  
  /** Get all draft products that can be added to PO */
  const { data: draftProducts = [] } = useGetDraftProductsQuery(undefined);
  
  /** Function to create a new draft product */
  const [createDraftProduct] = useCreateDraftProductMutation();

  // ========================================
  // PREVENT DOUBLE SUBMISSION
  // ========================================
  
  /** Track if we're currently submitting to prevent duplicate submissions */
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // ========================================
  // DERIVE SUPPLIERS LIST from existing POs
  // ========================================
  
  /**
   * Extract unique suppliers from all purchase orders
   * We do this because there's no separate "getSuppliers" endpoint
   */
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
    
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [purchaseOrders]);

  /** Convert suppliers to dropdown options format */
  const supplierOptions: ComboOption[] = React.useMemo(
    () => suppliers.map((s) => ({ value: s.supplierId, label: s.name })),
    [suppliers]
  );

  // ========================================
  // DRAFT PRODUCTS - Convert to dropdown options
  // ========================================
  
  /** Normalize draft products from API */
  const drafts: DraftProductLite[] = React.useMemo(() => {5

    return (draftProducts as any[]).map((d) => ({
      id: d.id,
      name: d.name,
      unit: d.unit || "",
    }));
  }, [draftProducts]);

  console.log("drafts", drafts);
  



  /** Convert to dropdown options */
  const baseDraftOptions: ComboOption[] = React.useMemo(
    () => drafts.map((d) => ({ value: d.id, label: d.name })),
    [drafts]
  );
  console.log("Double Checking: ", draftProducts);

  /** 
   * Local cache for newly created draft products
   * This lets users see their new products immediately without waiting for refetch
   */
  const [localDraftOptions, setLocalDraftOptions] = React.useState<ComboOption[]>([]);

  /** Combine server products and locally created products */
  const draftOptions = React.useMemo(() => {
    const map = new Map<string, ComboOption>();
    for (const opt of [...localDraftOptions, ...baseDraftOptions]) {
      map.set(opt.value, opt);
    }
    return Array.from(map.values());
  }, [localDraftOptions, baseDraftOptions]);

  // ========================================
  // CREATE NEW DRAFT PRODUCT
  // ========================================
  
  /**
   * Creates a new draft product in the database
   * Called when user types a new product name in the dropdown
   * 
   * @param label - The product name entered by user
   * @returns The created product as a dropdown option
   */
  const onCreateDraft = React.useCallback(
    async (label: string): Promise<ComboOption> => {
      const name = label.trim();
      if (!name) return { value: "", label: "" };

      // Optionally ask for unit
      const unit = (window.prompt("Unit (optional) e.g. box, each") || "").trim();

      // Create in database
      const created = await createDraftProduct({ name, unit }).unwrap();

      // Add to local cache
      const opt: ComboOption = { value: created.id, label: created.name };
      setLocalDraftOptions((prev) => [opt, ...prev]);

      return opt;
    },
    [createDraftProduct]
  );

  // ========================================
  // CALCULATIONS - Automatically computed values
  // ========================================
  
  /** Sum of all line items (quantity × price) */
  const subtotal = React.useMemo(
    () =>
      rows.reduce(
        (sum, row) => sum + safeNumber(row.quantity) * safeNumber(row.unitPrice),
        0
      ),
    [rows]
  );

  /** Tax amount based on subtotal and tax percentage */
  const tax = subtotal * (safeNumber(taxPercent) / 100);

  /** Final total including tax */
  const total = subtotal + tax;

  // ========================================
  // FORM ACTIONS
  // ========================================
  
  /**
   * Resets all form fields to initial empty state
   * Used after successful creation
   */
  const reset = React.useCallback(() => {
    setPoNumber(genPONumber());
    setOrderDate(todayYMD());
    setDueDate(new Date());
    setNotes("");
    setTaxPercent(0);
    setRows([{ quantity: 1, unitPrice: 0, unit: "", name: "", draftProductId: "" }]);
    setSupplierDraft({
      mode: "new",
      supplierId: "",
      name: "",
      email: "",
      phone: "",
      address: "",
    });
  }, []);

  /**
   * Validates the form before submission
   * Checks:
   * - Supplier is selected or created
   * - At least one item exists
   * - All items have valid product and quantity
   * 
   * @returns true if form is valid, false otherwise
   */
  function validate(): boolean {
    // Check supplier
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

    // Check items
    if (!rows.length) {
      toast.error("Add at least one item");
      return false;
    }

    // Each item must have product and valid quantity
    if (rows.some((r) => !r.draftProductId || safeNumber(r.quantity) <= 0)) {
      toast.error("Each item must have a product and quantity > 0");
      return false;
    }

    return true;
  }

  /**
   * Handles form submission
   * Validates, builds payload, and calls onSubmit callback
   */
  const handleSubmit = React.useCallback(
    async () => {
      // Prevent double submission
      if (isSubmitting || submitting) return;

      // Validate form
      if (!validate()) return;

      setIsSubmitting(true);

      try {
        // Build line items
        const items = rows.map((r) => {
          const quantity = safeNumber(r.quantity);
          const unitPrice = safeNumber(r.unitPrice);
          return {
            productId: r.productId ?? r.draftProductId, // Real DB ID
            draftProductId: r.draftProductId,
            name: (r.name || "").trim(),
            unit: (r.unit || "").trim(),
            quantity,
            unitPrice,
            lineTotal: quantity * unitPrice,
          };
        });

        // Build base payload
        const base: NewPurchaseOrderDTO = {
          poNumber,
          orderDate,
          dueDate: dueDate || undefined,
          notes: notes || undefined,
          items,
          subtotal,
          status: initial?.status || "DRAFT",
          tax,
          total,
        };

        // Add supplier info based on mode
        let payload: PurchaseOrderFormPayload;
        
        if (supplierDraft.mode === "existing") {
          // Link to existing supplier
          payload = {
            ...base,
            supplierId: supplierDraft.supplierId,
          };
        } else {
          // Create new supplier
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

        // Submit to backend
        await onSubmit(payload);

        // Reset form only on create mode
        if (mode === "create") {
          reset();
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [
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
    ]
  );

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl border-2 border-blue-100 bg-blue-50/30 p-6">
        <h2 className="text-2xl font-bold text-slate-900">
          {mode === "create" ? "Create " : "Edit "}Purchase Order
        </h2>
        <p className="mt-2 text-slate-600">
          {mode === "create"
            ? "Create a new purchase order using draft products (not posted to inventory yet)."
            : "Update the purchase order details below."}
        </p>
      </div>

      {/* Supplier Section */}
      <SupplierSection
        suppliers={suppliers}
        supplierOptions={supplierOptions}
        value={supplierDraft}
        onChange={setSupplierDraft}
        disabled={submitting || isSubmitting}
      />

      {/* Items Table */}
      <POItemsTable
        rows={rows}
        onChange={setRows}
        drafts={drafts}
        draftOptions={draftOptions}
        onCreateDraft={onCreateDraft}
        disabled={submitting || isSubmitting}
      />

      {/* Metadata and Totals */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: PO Metadata */}
        <div className="space-y-6 rounded-2xl border-2 border-slate-200 bg-slate-50/50 p-6">
          <div>
            <Label className="text-sm font-medium text-slate-700">PO Number</Label>
            <Input
              className="mt-2 h-11 text-base"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              disabled={submitting || isSubmitting}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700">Order Date</Label>
            {/* <Input
              type="date"
              className="mt-2 h-11 text-base"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              disabled={submitting || isSubmitting}
            /> */}
            <div className="flex flex-col gap-3">
              <Label htmlFor="date" className="px-1">
                Order Date
              </Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="date"
                    className="w-48 justify-between font-normal"
                  >
                    {orderDate ? orderDate.toLocaleDateString() : "Select an Order Date"}
                    <ChevronDownIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={orderDate}
                    captionLayout="dropdown"
                    onSelect={(OrderDate) => {
                      setOrderDate(orderDate)
                      setOpen(false)
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>


            <div className="flex flex-col gap-3">
              <Label htmlFor="date" className="px-1">
                Due Date
              </Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="date"
                    className="w-48 justify-between font-normal"
                  >
                    {dueDate ? dueDate.toLocaleDateString() : "Select a due date"}
                    <ChevronDownIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    captionLayout="dropdown"
                    onSelect={(dueDate) => {
                      setDueDate(dueDate)
                      setOpen(false)
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

          <div>
            <Label className="text-sm font-medium text-slate-700">
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

        {/* Right: Totals */}
        <POTotalsCard
          subtotal={subtotal}
          taxPercent={taxPercent}
          onTaxPercentChange={setTaxPercent}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => router.back()}
          disabled={submitting || isSubmitting}
          className="h-11 px-6 text-base"
        >
          Cancel
        </Button>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || isSubmitting}
          className="h-11 px-8 text-base"
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