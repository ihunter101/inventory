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
    <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
      {/* Progress */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Payment Progress</span>
          <span className="font-bold text-foreground">{pct.toFixed(0)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Amounts */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-center">
        {[
          {
            label: "Invoice Total",
            value: currency(invoiceTotal),
            color: "text-foreground",
            labelColor: "text-muted-foreground",
          },
          {
            label: "Paid",
            value: currency(totalPaid),
            color: "text-emerald-700 dark:text-emerald-400",
            labelColor: "text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "Balance Due",
            value: balance > 0 ? currency(balance) : "—",
            color:
              balance > 0
                ? "text-amber-700 dark:text-amber-400"
                : "text-muted-foreground",
            labelColor:
              balance > 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-border/60 bg-card px-2 py-3"
          >
            <div
              className={`mb-1 text-[10px] font-semibold uppercase tracking-widest ${item.labelColor}`}
            >
              {item.label}
            </div>
            <div className={`text-sm font-bold ${item.color}`}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Payment ledger */}
      {payments.length > 0 && (
        <div className="space-y-1.5 border-t border-border/60 pt-2">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Payment History
          </div>

          {payments.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-200/50 bg-emerald-500/10 text-emerald-600 dark:border-emerald-900/40 dark:text-emerald-400">
                  <CreditCard size={14} />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-1.5 text-xs font-semibold text-foreground">
                    <span className="capitalize">{p.method ?? "Payment"}</span>
                    {p.reference && (
                      <>
                        <span className="text-border">·</span>
                        <span className="flex items-center gap-0.5 font-normal text-muted-foreground">
                          <Hash size={10} />
                          {p.reference}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
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

              <div className="shrink-0 pl-0 text-sm font-bold text-emerald-700 dark:text-emerald-400 sm:pl-3">
                {currency(p.amount)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}