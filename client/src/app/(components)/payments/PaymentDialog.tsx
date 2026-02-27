"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CreditCard, Landmark, Banknote, Hash } from "lucide-react";

import {
  useGetSupplierInvoiceQuery,
  useAddInvoicePaymentMutation,
  SupplierInvoiceDTO,
  PurchaseOrderDTO,
} from "@/app/state/api";


type Props = {
  invoiceId: string;
  invoice?: SupplierInvoiceDTO;
  payment: number;                 // amount suggested from checked lines
  disabled?: boolean;
  triggerLabel?: string;
  onSuccess?: () => void;
  children?: React.ReactNode;
};

export function PayInvoiceDialog({ invoiceId, invoice: initialInvoice, payment, disabled, triggerLabel, onSuccess, children  }: Props) {
  const [open, setOpen] = useState(false);

  const {
    data: fetchedInvoice,
    isFetching,
    isError,
  } = useGetSupplierInvoiceQuery(invoiceId, { skip: !open });

  const invoice = fetchedInvoice ?? initialInvoice
  
  if (!invoice) return null

  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<string>("cash");
  const [reference, setReference] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [addInvoicePayment, { isLoading: isPaying }] = useAddInvoicePaymentMutation();

  // useEffect(() => {
  //   if (open) refetch();
  // }, [open, refetch]);

  // Default amount = outstanding
  useEffect(() => {
  if (!open || !invoice) return;

  const outstanding =
    invoice.balanceRemaining != null
      ? Number(invoice.balanceRemaining)
      : Number(invoice.amount ?? 0);

  const suggested =
    payment > 0 ? Math.min(payment, outstanding) : outstanding;

  setAmount(suggested);
}, [open, invoice, payment]);

  const invoiceTotal = Number(invoice?.amount ?? 0);
  const outstanding =
    invoice?.balanceRemaining != null ? Number(invoice.balanceRemaining) : invoiceTotal;

  const safeAmount = Number.isFinite(amount) ? amount : 0;

  const remainingAfter = useMemo(
    () => Math.max(0, outstanding - safeAmount),
    [outstanding, safeAmount]
  );

  const amountValid = safeAmount > 0 && safeAmount <= outstanding;

  const isPayable = invoice.status === "VOID" || invoice.status === "PAID"

  const methodIcon = useMemo(() => {
    if (method === "wire") return <Landmark size={16} />;
    if (method === "card") return <CreditCard size={16} />;
    return <Banknote size={16} />;
  }, [method]);

  const handleConfirm = async () => {
    if (!invoice) return;

    try {
      if (!amountValid) {
        toast.error("Enter a valid amount (must be <= outstanding).");
        return;
      }

      // ✅ matches your mutation type:
      // body: Partial<InvoicePaymentDTO> & { amount: number }
      await addInvoicePayment({
        invoiceId,
        body: {
          amount: safeAmount,
          method,
          reference: reference.trim() || null,
          notes: notes.trim() || null,
          // If you want to control paidAt, send ISO:
          paidAt: new Date().toISOString(),
          // currency: null or "XCD" if you decide to store it from UI
        },
      }).unwrap();
      // await refetchInvoice();
      // await refectchPayments();

      toast.success("Payment recorded.");
      setOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to record payment.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-green-600 hover:bg-green-700"
          disabled={disabled || isPayable}
        >
          {triggerLabel ?? "Pay Invoice"}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[640px] p-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 bg-gradient-to-b from-muted/60 to-background border-b">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Record Payment
              {invoice?.invoiceNumber ? (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  — {invoice.invoiceNumber}
                </span>
              ) : null}
            </DialogTitle>
          </DialogHeader>

          {/* Invoice snapshot */}
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg border bg-background p-3">
              <div className="text-xs text-muted-foreground">Supplier</div>
              <div className="font-medium truncate">{invoice?.supplier ?? "—"}</div>
            </div>

            <div className="rounded-lg border bg-background p-3">
              <div className="text-xs text-muted-foreground">Invoice Total</div>
              <div className="text-base font-semibold">${invoiceTotal.toFixed(2)}</div>
            </div>

            <div className="rounded-lg border bg-background p-3">
              <div className="text-xs text-muted-foreground">Outstanding</div>
              <div className="text-base font-semibold">${outstanding.toFixed(2)}</div>
            </div>
          </div>

          {isFetching && (
            <div className="mt-3 text-sm text-muted-foreground">Loading latest invoice…</div>
          )}
          {isError && (
            <div className="mt-3 text-sm text-red-600">Failed to load invoice details.</div>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Choose method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="wire">Wire / Bank Transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                {methodIcon}
                <span>Captured for audit trail.</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Hash size={14} /> Reference (optional)
              </Label>
              <Input
                className="h-11"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Receipt #, Cheque #, Transfer ref…"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Input
              className="h-11"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any extra info for this payment..."
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Amount to Pay</Label>
            <Input
              className="h-12 text-base"
              type="number"
              value={Number.isFinite(amount) ? amount : 0}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={0}
              max={outstanding}
            />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Remaining after payment</span>
              <span className={remainingAfter === 0 ? "font-semibold text-green-700" : "font-medium"}>
                ${remainingAfter.toFixed(2)}
              </span>
            </div>

            {!amountValid && open && (
              <div className="text-xs text-amber-700">
                Amount must be greater than 0 and not exceed the outstanding balance.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" onClick={() => setOpen(false)} className="h-11">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!amountValid || isPaying || isFetching || !invoice}
            className="h-11 bg-green-600 hover:bg-green-700"
          >
            {isPaying ? "Recording..." : "Confirm Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
