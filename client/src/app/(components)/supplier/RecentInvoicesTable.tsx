import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { formatMoney, formatDate } from "../../../lib/formatters";


interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  paidAmount: number;
  balanceRemaining: number;
  status: string;
  date: string | Date | null;
}
 
export function RecentInvoicesTable({ invoices }: { invoices: RecentInvoice[] }) {
  return (
    <Card className="rounded-xl border">
      <CardHeader className="flex flex-row items-center justify-between px-5 pt-5 pb-3">
        <CardTitle className="text-sm font-medium">Recent invoices</CardTitle>
        <span className="text-xs text-muted-foreground">Last 10</span>
      </CardHeader>
 
      <CardContent className="p-0">
        {invoices.length === 0 ? (
          <p className="px-5 py-4 text-xs text-muted-foreground">No invoices yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/40">
                  {["Invoice", "Status", "Amount", "Paid", "Owed", "Date"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`py-2.5 font-normal text-muted-foreground ${
                          i === 0 ? "pl-5 pr-3 text-left" : i === 5 ? "pl-3 pr-5 text-right" : "px-3 text-right"
                        }`}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="transition-colors hover:bg-muted/30">
                    <td className="py-3 pl-5 pr-3 font-medium">{inv.invoiceNumber}</td>
                    <td className="px-3 py-3">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatMoney(inv.amount)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-emerald-600">
                      {formatMoney(inv.paidAmount)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {inv.balanceRemaining > 0 ? (
                        <span className="font-medium text-destructive">
                          {formatMoney(inv.balanceRemaining)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{formatMoney(0)}</span>
                      )}
                    </td>
                    <td className="py-3 pl-3 pr-5 text-right text-muted-foreground">
                      {formatDate(inv.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}