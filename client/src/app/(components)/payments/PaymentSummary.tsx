import { PaymentRecord } from "@/app/features/components/MatchTable";
import { currency } from "@/lib/currency";
import { Calendar, CreditCard, Hash } from "lucide-react";

export default function PaymentSummaryPanel({
  invoiceTotal,
  payments,
  balanceRemaining,
}: {
  invoiceTotal: number;
  payments: PaymentRecord[];
  balanceRemaining?: number | null;
}) {
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const balance =
    balanceRemaining != null ? Number(balanceRemaining) : invoiceTotal - totalPaid;
  const pct = invoiceTotal > 0 ? Math.min((totalPaid / invoiceTotal) * 100, 100) : 0;

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
      {/* Progress */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-zinc-500">
          <span>Payment Progress</span>
          <span className="font-bold text-zinc-700">{pct.toFixed(0)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-zinc-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Amounts */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          {
            label: "Invoice Total",
            value: currency(invoiceTotal),
            color: "text-zinc-800",
            labelColor: "text-zinc-400",
          },
          {
            label: "Paid",
            value: currency(totalPaid),
            color: "text-emerald-700",
            labelColor: "text-emerald-500",
          },
          {
            label: "Balance Due",
            value: balance > 0 ? currency(balance) : "—",
            color: balance > 0 ? "text-amber-700" : "text-zinc-400",
            labelColor: balance > 0 ? "text-amber-500" : "text-zinc-400",
          },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-lg border border-zinc-100 py-2.5 px-1">
            <div className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ${item.labelColor}`}>
              {item.label}
            </div>
            <div className={`text-sm font-bold ${item.color}`}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Payment ledger */}
      {payments.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-zinc-200">
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
            Payment History
          </div>
          {payments.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg bg-white border border-zinc-100 px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                  <CreditCard size={14} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-1.5 text-xs font-semibold text-zinc-800">
                    <span className="capitalize">{p.method ?? "Payment"}</span>
                    {p.reference && (
                      <>
                        <span className="text-zinc-300">·</span>
                        <span className="flex items-center gap-0.5 text-zinc-500 font-normal">
                          <Hash size={10} />
                          {p.reference}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
                    <Calendar size={9} />
                    {p.paidAt
                      ? new Date(p.paidAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </div>
                </div>
              </div>
              <div className="text-sm font-bold text-emerald-700 shrink-0 pl-3">
                {currency(p.amount)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}