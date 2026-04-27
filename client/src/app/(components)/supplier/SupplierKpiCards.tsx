import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wallet,
  Receipt,
  AlertCircle,
  Truck,
  FileText,
  Clock,
  TrendingUp,
  Info,
} from "lucide-react";
import { formatMoney } from "../../../lib/formatters";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";



interface Kpis {
  totalPaid: number;
  totalOwed: number;
  totalInvoiceAmount: number;
  totalInvoices: number;
  totalPayments: number;
  totalPurchaseOrders: number;
  totalPurchaseOrderAmount: number;
  paymentRate: number;
  averageDeliveryDays: number | null;
  fastestDeliveryDays: number | null;
  slowestDeliveryDays: number | null;
  overdueInvoiceCount: number;
}
 
export function SupplierKpiCards({ kpis }: { kpis: Kpis }) {
  const rate = kpis.paymentRate;
  const r = 22;
  const circ = 2 * Math.PI * r;
  const filled = (rate / 100) * circ;
 
  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-2.5">
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total paid"
            value={formatMoney(kpis.totalPaid)}
            sub={`${kpis.totalPayments} payment${kpis.totalPayments !== 1 ? "s" : ""} posted`}
            tip="Sum of all POSTED invoice payments for this supplier"
          />
          <StatCard
            label="Amount owed"
            value={formatMoney(kpis.totalOwed)}
            sub={
              kpis.overdueInvoiceCount > 0
                ? `${kpis.overdueInvoiceCount} overdue invoice${kpis.overdueInvoiceCount !== 1 ? "s" : ""}`
                : "No overdue invoices"
            }
            tip="Sum of balanceRemaining across all active (non-void) invoices"
            accent={kpis.totalOwed > 0 ? "danger" : undefined}
          />
          <StatCard
            label="Invoice total"
            value={formatMoney(kpis.totalInvoiceAmount)}
            sub={`${kpis.totalInvoices} invoice${kpis.totalInvoices !== 1 ? "s" : ""}`}
            tip="Total amount across all non-voided supplier invoices"
          />
 
          {/* Payment rate ring */}
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
            <svg width="52" height="52" viewBox="0 0 56 56" className="flex-shrink-0">
              <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth="5" />
              <circle
                cx="28" cy="28" r={r} fill="none"
                stroke={rate >= 80 ? "#16a34a" : rate > 0 ? "#d97706" : "#6b7280"}
                strokeWidth="5"
                strokeDasharray={`${filled} ${circ - filled}`}
                strokeLinecap="round"
                transform="rotate(-90 28 28)"
              />
              <text x="28" y="32" textAnchor="middle" fontSize="11" fontWeight="500" fill="currentColor">
                {rate}%
              </text>
            </svg>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Payment rate</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Paid vs. invoiced</p>
            </div>
          </div>
        </div>
 
        <div className="grid gap-2.5 sm:grid-cols-3">
          <StatCard
            label="Purchase orders"
            value={String(kpis.totalPurchaseOrders)}
            sub={`${formatMoney(kpis.totalPurchaseOrderAmount)} total`}
            tip="Count and value of all purchase orders from this supplier"
          />
          <StatCard
            label="Avg. delivery"
            value={kpis.averageDeliveryDays !== null ? `${kpis.averageDeliveryDays} days` : "—"}
            sub={kpis.averageDeliveryDays !== null ? "PO order date → GRN date" : "No GRNs recorded yet"}
            tip="Average days from PO order date to first GRN receipt date"
          />
          <StatCard
            label="Delivery range"
            value={
              kpis.fastestDeliveryDays !== null && kpis.slowestDeliveryDays !== null
                ? `${kpis.fastestDeliveryDays} – ${kpis.slowestDeliveryDays} days`
                : "No data"
            }
            sub="Fastest to slowest"
            tip="Shortest and longest delivery times across all PO → GRN pairs"
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
 
type Accent = "danger" | "success" | "warning";
const accentValue: Record<Accent, string> = {
  danger: "text-destructive",
  success: "text-emerald-600",
  warning: "text-amber-600",
};
 
function StatCard({
  label, value, sub, tip, accent,
}: {
  label: string; value: string; sub: string; tip: string; accent?: Accent;
}) {
  return (
    <div className="rounded-lg bg-muted/50 px-4 py-3">
      <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3 w-3 cursor-help opacity-40" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px] text-center text-xs">
            {tip}
          </TooltipContent>
        </Tooltip>
      </div>
      <p className={cn("mt-1.5 text-xl font-medium leading-none", accent ? accentValue[accent] : "")}>
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}





