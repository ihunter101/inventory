"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { Sales, useCreateSaleMutation, useUpdateSaleMutation } from "@/app/state/api";

type Mode = "create" | "edit";

type DenominationKey =
  | "hundredsCount"
  | "fiftiesCount"
  | "twentiesCount"
  | "tensCount"
  | "fivesCount";

const DENOMINATIONS: Array<{ name: DenominationKey; label: string; value: number }> = [
  { name: "hundredsCount", label: "$100 Bills", value: 100 },
  { name: "fiftiesCount", label: "$50 Bills", value: 50 },
  { name: "twentiesCount", label: "$20 Bills", value: 20 },
  { name: "tensCount", label: "$10 Bills", value: 10 },
  { name: "fivesCount", label: "$5 Bills", value: 5 },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "XCD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function todayYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * We include editReason in the schema, but only REQUIRE it when:
 * - mode === "edit"
 * - requireEditNote === true
 *
 * We'll enforce that with superRefine.
 */
const salesFormSchema = z
  .object({
    salesDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),

    hundredsCount: z.number().int().min(0),
    fiftiesCount: z.number().int().min(0),
    twentiesCount: z.number().int().min(0),
    tensCount: z.number().int().min(0),
    fivesCount: z.number().int().min(0),

    cashTotal: z.number().min(0),
    creditCardTotal: z.number().min(0),
    debitCardTotal: z.number().min(0),
    chequeTotal: z.number().min(0),
    grandTotal: z.number().min(0),

    notes: z.string().optional(),

    // admin edit reason
    editReason: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    // parent will enforce requirement via form option; keep schema flexible
    // (we’ll do runtime requirement inside component to keep schema reusable)
  });

type SalesFormData = z.infer<typeof salesFormSchema>;

type SalesEntryFormProps = {
  mode: Mode;
  initialSale?: Sales;              // prefill when editing
  requireEditNote?: boolean;        // admin edits must include a reason
  onSubmitted?: () => void;         // tell parent to switch to summary
  onCancelEdit?: () => void;        // admin cancels edit -> back to summary
};

export function SalesEntryForm({
  mode,
  initialSale,
  requireEditNote = false,
  onSubmitted,
  onCancelEdit,
}: SalesEntryFormProps) {
  const [createSale, { isLoading: isCreating }] = useCreateSaleMutation();
  const [updateSale, { isLoading: isUpdating }] = useUpdateSaleMutation();

  const isEditMode = mode === "edit";
  const saving = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SalesFormData>({
    resolver: zodResolver(salesFormSchema),
    defaultValues: {
      salesDate: todayYYYYMMDD(),
      hundredsCount: 0,
      fiftiesCount: 0,
      twentiesCount: 0,
      tensCount: 0,
      fivesCount: 0,
      cashTotal: 0,
      creditCardTotal: 0,
      debitCardTotal: 0,
      chequeTotal: 0,
      grandTotal: 0,
      notes: "",
      editReason: "",
    },
    mode: "onChange",
  });

  const watched = watch();

  // Prefill ONLY when parent passes initialSale (admin clicking edit)
  useEffect(() => {
    if (!isEditMode || !initialSale) return;

    reset({
      salesDate: initialSale.salesDate.split("T")[0],
      hundredsCount: initialSale.hundredsCount,
      fiftiesCount: initialSale.fiftiesCount,
      twentiesCount: initialSale.twentiesCount,
      tensCount: initialSale.tensCount,
      fivesCount: initialSale.fivesCount,

      cashTotal: Number(initialSale.cashTotal),
      creditCardTotal: Number(initialSale.creditCardTotal),
      debitCardTotal: Number(initialSale.debitCardTotal),
      chequeTotal: Number(initialSale.chequeTotal),
      grandTotal: Number(initialSale.grandTotal),

      notes: initialSale.notes || "",
      editReason: "",
    });
  }, [isEditMode, initialSale, reset]);

  // Auto-calc cash total
  const calculatedCashTotal = useMemo(() => {
    return DENOMINATIONS.reduce((sum, denom) => {
      const count = watched[denom.name] ?? 0;
      return sum + count * denom.value;
    }, 0);
  }, [
    watched.hundredsCount,
    watched.fiftiesCount,
    watched.twentiesCount,
    watched.tensCount,
    watched.fivesCount,
  ]);

  useEffect(() => {
    if (calculatedCashTotal !== (watched.cashTotal ?? 0)) {
      setValue("cashTotal", calculatedCashTotal, { shouldValidate: true, shouldDirty: true });
    }
  }, [calculatedCashTotal, watched.cashTotal, setValue]);

  // Auto-calc grand total
  const calculatedGrandTotal = useMemo(() => {
    return (
      (watched.cashTotal ?? 0) +
      (watched.creditCardTotal ?? 0) +
      (watched.debitCardTotal ?? 0) +
      (watched.chequeTotal ?? 0)
    );
  }, [watched.cashTotal, watched.creditCardTotal, watched.debitCardTotal, watched.chequeTotal]);

  useEffect(() => {
    if (calculatedGrandTotal !== (watched.grandTotal ?? 0)) {
      setValue("grandTotal", calculatedGrandTotal, { shouldValidate: true, shouldDirty: true });
    }
  }, [calculatedGrandTotal, watched.grandTotal, setValue]);

  const submitHandler = async (form: SalesFormData) => {
    try {
      // Enforce edit note when required
      if (isEditMode && requireEditNote) {
        const reason = (form.editReason ?? "").trim();
        if (reason.length < 10) {
          setError("editReason", { type: "manual", message: "Please enter a clear reason (min 10 characters)." });
          return;
        }
      }

      const salesDateISO = new Date(`${form.salesDate}T00:00:00`).toISOString();

      const payload = {
        ...form,
        salesDate: salesDateISO,
      };

      if (isEditMode) {
        if (!initialSale?.id) {
          toast.error("Missing sale id for edit.");
          return;
        }

        // IMPORTANT: you should send editReason to backend for auditing
        await updateSale({ id: initialSale.id, data: payload }).unwrap();
        toast.success("Sale updated successfully");
      } else {
        await createSale(payload).unwrap();
        toast.success("Sale created successfully");
      }

      // Clear local state so user sees summary state in parent
      reset({
        salesDate: todayYYYYMMDD(),
        hundredsCount: 0,
        fiftiesCount: 0,
        twentiesCount: 0,
        tensCount: 0,
        fivesCount: 0,
        cashTotal: 0,
        creditCardTotal: 0,
        debitCardTotal: 0,
        chequeTotal: 0,
        grandTotal: 0,
        notes: "",
        editReason: "",
      });

      onSubmitted?.();
    } catch (error: any) {
      toast.error(error?.data?.message || error?.data?.error || "Failed to save sale");
      console.error(error);
    }
  };

  const disabled = isSubmitting || saving;

  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-green-900">
          {isEditMode ? "Edit Sale" : "Enter Today's Cash"}
        </h2>
        <p className="text-sm text-green-600 mt-1">
          Record daily sales and cash denomination for your location
        </p>
      </div>

      <form onSubmit={handleSubmit(submitHandler)} className="space-y-8">
        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="salesDate">Sales Date</Label>
          <Input
            id="salesDate"
            type="date"
            {...register("salesDate")}
            className="max-w-xs"
            disabled={isEditMode} // lock date when editing
          />
          {errors.salesDate && <p className="text-sm text-red-600">{errors.salesDate.message}</p>}
        </div>

        {/* Cash Denominations */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Cash Breakdown</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DENOMINATIONS.map((denom) => {
              const count = watched[denom.name] ?? 0;
              const lineTotal = count * denom.value;

              return (
                <div className="space-y-2" key={denom.name}>
                  <Label htmlFor={denom.name}>{denom.label}</Label>

                  <div className="flex items-center gap-2">
                    <Input
                      id={denom.name}
                      type="number"
                      min={0}
                      {...register(denom.name, { valueAsNumber: true })}
                      className="flex-1"
                    />
                    <span className="text-sm text-green-600 w-24 text-right">
                      {formatCurrency(lineTotal)}
                    </span>
                  </div>

                  {errors[denom.name] && (
                    <p className="text-sm text-red-600">{errors[denom.name]?.message as any}</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-green-900">Total Cash:</span>
              <span className="font-semibold text-green-700">
                {formatCurrency(watched.cashTotal ?? 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Other Payment Methods */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Other Payment Methods</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="creditCardTotal">Credit Card Total</Label>
              <Input
                id="creditCardTotal"
                type="number"
                step="0.01"
                min={0}
                {...register("creditCardTotal", { valueAsNumber: true })}
              />
              {errors.creditCardTotal && (
                <p className="text-sm text-red-600">{errors.creditCardTotal.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="debitCardTotal">Debit Card Total</Label>
              <Input
                id="debitCardTotal"
                type="number"
                step="0.01"
                min={0}
                {...register("debitCardTotal", { valueAsNumber: true })}
              />
              {errors.debitCardTotal && (
                <p className="text-sm text-red-600">{errors.debitCardTotal.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="chequeTotal">Cheque Total</Label>
              <Input
                id="chequeTotal"
                type="number"
                step="0.01"
                min={0}
                {...register("chequeTotal", { valueAsNumber: true })}
              />
              {errors.chequeTotal && (
                <p className="text-sm text-red-600">{errors.chequeTotal.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Grand Total */}
        <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-300">
          <div className="flex justify-between items-center">
            <span className="text-xl font-semibold text-gray-900">Grand Total:</span>
            <span className="text-3xl font-bold text-blue-700">
              {formatCurrency(watched.grandTotal ?? 0)}
            </span>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            {...register("notes")}
            placeholder="Add any additional notes about today's sales..."
            rows={3}
          />
        </div>

        {/* REQUIRED EDIT NOTE (admin) */}
        {isEditMode && requireEditNote && (
          <div className="space-y-2">
            <Label htmlFor="editReason">Edit Reason (Required)</Label>
            <Textarea
              id="editReason"
              {...register("editReason")}
              placeholder="Explain why this sales entry must be changed (required for audit)..."
              rows={3}
            />
            {errors.editReason && <p className="text-sm text-red-600">{errors.editReason.message}</p>}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={disabled} className="flex-1" size="lg">
            {disabled ? "Saving..." : isEditMode ? "Update Sales Entry" : "Submit Sales Entry"}
          </Button>

          {isEditMode && (
            <Button type="button" variant="outline" onClick={onCancelEdit}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
