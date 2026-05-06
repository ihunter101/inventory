"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useQueueQuickBooksInvoicePaymentMutation } from "@/app/state/api";

type PaymentMethod =
  | "CASH"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "CHEQUE"
  | "BANK_TRANSFER"
  | "OTHER";

type QueueInvoicePaymentDialogProps = {
  invoiceId: string;
  invoiceNumber?: string | null;
  balanceRemaining: number;
};

export default function QueueInvoicePaymentDialog({
  invoiceId,
  invoiceNumber,
  balanceRemaining,
}: QueueInvoicePaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(balanceRemaining || ""));
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CHEQUE");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [memo, setMemo] = useState("Payment recorded from custom app");

  const [queuePayment, { isLoading }] = useQueueQuickBooksInvoicePaymentMutation();

  async function handleSubmit() {
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      toast.error("Enter a valid payment amount.");
      return;
    }

    if (numericAmount > balanceRemaining) {
      toast.error("Payment cannot be greater than the balance remaining.");
      return;
    }

    try {
      await queuePayment({
        invoiceId,
        body: {
          amount: numericAmount,
          paymentDate,
          paymentMethod,
          referenceNumber: referenceNumber || undefined,
          memo: memo || undefined,
        },
      }).unwrap();

      toast.success("Payment queued for QuickBooks sync.");
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to queue payment.");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        Mark Paid
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-zinc-950">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Queue Invoice Payment
              </h2>
              <p className="text-sm text-zinc-500">
                Invoice {invoiceNumber || invoiceId}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Amount
                </label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Balance remaining: {balanceRemaining.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Payment Date
                </label>
                <input
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  type="date"
                  className="w-full rounded-lg border px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full rounded-lg border px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <option value="CHEQUE">Cheque</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Reference Number
                </label>
                <input
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Cheque number / receipt number"
                  className="w-full rounded-lg border px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Memo
                </label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {isLoading ? "Queuing..." : "Queue Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}