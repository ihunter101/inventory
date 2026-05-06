"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useBatchMarkInvoicesPaidForQuickBooksMutation } from "@/app/state/api";

type PaymentMethod =
  | "CASH"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "CHEQUE"
  | "BANK_TRANSFER"
  | "OTHER";

export default function BatchMarkInvoicesPaidForm() {
  const [startDate, setStartDate] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CHEQUE");
  const [referencePrefix, setReferencePrefix] = useState("BATCH-PAY");
  const [memo, setMemo] = useState("Batch payment recorded from custom app");
  const [dryRun, setDryRun] = useState(true);

  const [batchMarkPaid, { isLoading, data }] =
    useBatchMarkInvoicesPaidForQuickBooksMutation();

  async function handleSubmit() {
    if (!startDate || !endDate) {
      toast.error("Start date and end date are required.");
      return;
    }

    try {
      const result = await batchMarkPaid({
  startDate,
  endDate,
  paymentDate,
  paymentMethod,
  referencePrefix,
  memo,
  dryRun,
  customerSearch: customerSearch.trim() || undefined,
}).unwrap();

      toast.success(result.message);
    } catch (error: any) {
      toast.error(error?.data?.message || "Batch operation failed.");
    }
  }

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">Batch Mark Invoices Paid</h2>
        <p className="text-sm text-zinc-500">
          Finds unpaid invoices by invoice date range, creates customer payments,
          marks them paid locally, and queues QuickBooks ReceivePayment sync jobs.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>
        <div>
  <label className="mb-1 block text-sm font-medium">Customer</label>
  <input
    value={customerSearch}
    onChange={(e) => setCustomerSearch(e.target.value)}
    placeholder="Search customer name or company"
    className="w-full rounded-lg border px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
  />
  <p className="mt-1 text-xs text-zinc-500">
    Leave blank to include all customers in the date range.
  </p>
</div>

        <div>
          <label className="mb-1 block text-sm font-medium">Payment Date</label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Payment Method</label>
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
          <label className="mb-1 block text-sm font-medium">Reference Prefix</label>
          <input
            value={referencePrefix}
            onChange={(e) => setReferencePrefix(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Memo</label>
          <input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          id="dryRun"
          type="checkbox"
          checked={dryRun}
          onChange={(e) => setDryRun(e.target.checked)}
        />
        <label htmlFor="dryRun" className="text-sm">
          Dry run preview only
        </label>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {isLoading
            ? "Processing..."
            : dryRun
              ? "Preview Batch"
              : "Mark Paid & Queue Sync"}
        </button>
      </div>

      {data?.data && (
        <div className="mt-6 rounded-xl border p-4 dark:border-zinc-800">
          <div className="grid gap-3 text-sm md:grid-cols-4">
            <div>
              <p className="text-zinc-500">Found</p>
              <p className="font-semibold">{data.data.found}</p>
            </div>
            <div>
              <p className="text-zinc-500">Queued</p>
              <p className="font-semibold">{data.data.queued}</p>
            </div>
            <div>
              <p className="text-zinc-500">Skipped</p>
              <p className="font-semibold">{data.data.skipped}</p>
            </div>
            <div>
              <p className="text-zinc-500">Failed</p>
              <p className="font-semibold">{data.data.failed}</p>
            </div>
          </div>

          <div className="mt-4 max-h-80 overflow-auto rounded-lg border dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-900">
                <tr>
                  <th className="p-2">Invoice</th>
                  <th className="p-2">Customer</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                {data.data.items.map((item) => (
                  <tr key={item.invoiceId} className="border-t dark:border-zinc-800">
                    <td className="p-2">{item.invoiceNumber || item.invoiceId}</td>
                    <td className="p-2">{item.customerName}</td>
                    <td className="p-2">{Number(item.amount).toFixed(2)}</td>
                    <td className="p-2">{item.status}</td>
                    <td className="p-2 text-zinc-500">{item.reason || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}