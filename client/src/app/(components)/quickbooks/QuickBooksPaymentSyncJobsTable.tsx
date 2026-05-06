"use client";

import {
  useGetQuickBooksPaymentSyncJobsQuery,
  useRetryQuickBooksPaymentSyncJobMutation,
} from "@/app/state/api";
import { toast } from "sonner";

export default function QuickBooksPaymentSyncJobsTable() {
  const { data, isLoading, isError } = useGetQuickBooksPaymentSyncJobsQuery();
  const [retryJob, { isLoading: isRetrying }] =
    useRetryQuickBooksPaymentSyncJobMutation();

  async function handleRetry(jobId: string) {
    try {
      await retryJob(jobId).unwrap();
      toast.success("Job queued for retry.");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to retry job.");
    }
  }

  if (isLoading) {
    return <p className="text-sm text-zinc-500">Loading payment sync jobs...</p>;
  }

  if (isError) {
    return <p className="text-sm text-red-500">Failed to load payment sync jobs.</p>;
  }

  const jobs = data?.jobs ?? [];

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">QuickBooks Payment Sync Jobs</h2>
        <p className="text-sm text-zinc-500">
          Tracks payments created in the app and waiting to be written to QuickBooks.
        </p>
      </div>

      <div className="overflow-auto rounded-lg border dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 dark:bg-zinc-900">
            <tr>
              <th className="p-2">Created</th>
              <th className="p-2">Invoice</th>
              <th className="p-2">Customer</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Status</th>
              <th className="p-2">Attempts</th>
              <th className="p-2">QB Payment TxnID</th>
              <th className="p-2">Error</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {jobs.map((job) => {
              const payment = job.payment;
              const invoice = payment?.invoice;

              return (
                <tr key={job.id} className="border-t dark:border-zinc-800">
                  <td className="p-2">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-2">
                    {invoice?.invoiceNumber || invoice?.invoiceId || "-"}
                  </td>
                  <td className="p-2">
                    {payment?.customerName || invoice?.customerName || "-"}
                  </td>
                  <td className="p-2">
                    {payment?.amount !== undefined && payment?.amount !== null
                      ? Number(payment.amount).toFixed(2)
                      : "-"}
                  </td>
                  <td className="p-2">
                    <span className="rounded-full border px-2 py-1 text-xs dark:border-zinc-700">
                      {job.status}
                    </span>
                  </td>
                  <td className="p-2">{job.attempts}</td>
                  <td className="p-2">{job.qbPaymentTxnId || "-"}</td>
                  <td className="max-w-xs truncate p-2 text-red-500">
                    {job.errorMessage || "-"}
                  </td>
                  <td className="p-2">
                    {job.status === "FAILED" ? (
                      <button
                        type="button"
                        disabled={isRetrying}
                        onClick={() => handleRetry(job.id)}
                        className="rounded-lg border px-3 py-1 text-xs hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-800 dark:hover:bg-zinc-900"
                      >
                        Retry
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              );
            })}

            {jobs.length === 0 && (
              <tr>
                <td colSpan={9} className="p-4 text-center text-zinc-500">
                  No QuickBooks payment sync jobs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}