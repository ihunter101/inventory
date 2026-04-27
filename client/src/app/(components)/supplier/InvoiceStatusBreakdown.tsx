import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { formatMoney } from "../../../lib/formatters";

 
interface StatusRow {
  status: string;
  count: number;
  totalAmount: number;
}
 
export function InvoiceStatusBreakdown({
  breakdown,
  totalInvoiceAmount,
}: {
  breakdown: StatusRow[];
  totalInvoiceAmount: number;
}) {
  return (
    <Card className="rounded-xl border">
      <CardHeader className="px-5 pt-5 pb-3">
        <CardTitle className="text-sm font-medium">Invoice breakdown</CardTitle>
      </CardHeader>
 
      <CardContent className="px-5 pb-4 space-y-3.5">
        {breakdown.length === 0 ? (
          <p className="text-xs text-muted-foreground">No invoice data.</p>
        ) : (
          breakdown.map((row) => {
            const pct =
              totalInvoiceAmount > 0
                ? Math.round((row.totalAmount / totalInvoiceAmount) * 100)
                : 0;
 
            return (
              <div key={row.status} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <InvoiceStatusBadge status={row.status} />
                    <span className="text-xs text-muted-foreground">
                      {row.count}
                    </span>
                  </div>
                  <span className="text-xs font-medium tabular-nums">
                    {formatMoney(row.totalAmount)}
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground/25 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}