import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { formatMoney, formatDate, daysFromNow } from "../../../lib/formatters";

interface OverdueInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  balanceRemaining: number;
  date: string | Date | null;
  dueDate: string | Date | null;
  status: string;
}
 
export function OverdueInvoicesTable({ invoices }: { invoices: OverdueInvoice[] }) {
  return (
    <Card className="rounded-xl border border-destructive/15">
      <CardHeader className="flex flex-row items-center justify-between px-5 pt-5 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <span className="h-2 w-2 rounded-full bg-destructive" />
          Overdue invoices
        </CardTitle>
        {invoices.length > 0 && (
          <span className="rounded bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
            {invoices.length} overdue
          </span>
        )}
      </CardHeader>
 
      <CardContent className="p-0">
        {invoices.length === 0 ? (
          <p className="px-5 py-4 text-xs text-muted-foreground">
            No overdue invoices — all clear.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-destructive/5">
                  {["Invoice", "Status", "Amount", "Owed", "Due date"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`py-2.5 font-normal text-muted-foreground ${
                          i === 0 ? "pl-5 pr-3 text-left" : i === 4 ? "pl-3 pr-5 text-right" : "px-3 text-right"
                        }`}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((inv) => {
                  const daysLate = daysFromNow(inv.dueDate);
                  const daysLateAbs =
                    daysLate !== null && daysLate < 0
                      ? Math.abs(daysLate)
                      : null;
 
                  return (
                    <tr
                      key={inv.id}
                      className="transition-colors hover:bg-destructive/5"
                    >
                      <td className="py-3 pl-5 pr-3 font-medium">{inv.invoiceNumber}</td>
                      <td className="px-3 py-3">
                        <InvoiceStatusBadge status={inv.status} />
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatMoney(inv.amount)}</td>
                      <td className="px-3 py-3 text-right tabular-nums font-medium text-destructive">
                        {formatMoney(inv.balanceRemaining)}
                      </td>
                      <td className="py-3 pl-3 pr-5 text-right">
                        <span className="text-muted-foreground">{formatDate(inv.dueDate)}</span>
                        {daysLateAbs !== null && (
                          <span className="ml-1.5 inline-block rounded bg-destructive/10 px-1.5 py-px text-[10px] font-medium text-destructive">
                            {daysLateAbs}d late
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}