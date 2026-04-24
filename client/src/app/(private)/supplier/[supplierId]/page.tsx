"use client";

import { useParams } from "next/navigation";
import { useGetSuppliersAnalyticsQuery } from "@/app/state/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Truck,
  Wallet,
  Receipt,
  AlertCircle,
  Clock,
  FileText,
} from "lucide-react";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-LC", {
    style: "currency",
    currency: "XCD",
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-LC", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

export default function SupplierDetailsPage() {
  const params = useParams();
const supplierId =
  typeof params.supplierId === "string" ? params.supplierId : "";

const { data, isLoading, isError } = useGetSuppliersAnalyticsQuery(supplierId, {
  skip: !supplierId,
});
  if (isLoading) {
    return <div className="p-6">Loading supplier analytics...</div>;
  }

  if (isError || !data) {
    return <div className="p-6">Failed to load supplier analytics.</div>;
  }

  const { supplier, kpis } = data;

  return (
    <main className="space-y-6 p-6">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">
          {supplier.name}
        </h1>

        <p className="text-muted-foreground">
          {supplier.email} • {supplier.phone}
        </p>

        <p className="text-sm text-muted-foreground">
          {supplier.address}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total Paid"
          value={formatMoney(kpis.totalPaid)}
          description={`${kpis.totalPayments} payment(s) posted`}
          icon={<Wallet className="h-5 w-5" />}
        />

        <KpiCard
          title="Total Owed"
          value={formatMoney(kpis.totalOwed)}
          description={`${kpis.overdueInvoiceCount} overdue invoice(s)`}
          icon={<AlertCircle className="h-5 w-5" />}
        />

        <KpiCard
          title="Invoice Total"
          value={formatMoney(kpis.totalInvoiceAmount)}
          description={`${kpis.totalInvoices} supplier invoice(s)`}
          icon={<Receipt className="h-5 w-5" />}
        />

        <KpiCard
          title="Average Delivery"
          value={
            kpis.averageDeliveryDays !== null
              ? `${kpis.averageDeliveryDays} days`
              : "No GRNs yet"
          }
          description="PO order date to GRN date"
          icon={<Truck className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title="Purchase Orders"
          value={String(kpis.totalPurchaseOrders)}
          description={formatMoney(kpis.totalPurchaseOrderAmount)}
          icon={<FileText className="h-5 w-5" />}
        />

        <KpiCard
          title="Payment Rate"
          value={`${kpis.paymentRate}%`}
          description="Paid amount vs invoice amount"
          icon={<Wallet className="h-5 w-5" />}
        />

        <KpiCard
          title="Delivery Range"
          value={
            kpis.fastestDeliveryDays !== null &&
            kpis.slowestDeliveryDays !== null
              ? `${kpis.fastestDeliveryDays} - ${kpis.slowestDeliveryDays} days`
              : "No data"
          }
          description="Fastest to slowest delivery"
          icon={<Clock className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-3">Invoice</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Amount</th>
                    <th className="py-3">Paid</th>
                    <th className="py-3">Owed</th>
                    <th className="py-3">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {data.recentInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b">
                      <td className="py-3 font-medium">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="py-3">{invoice.status}</td>
                      <td className="py-3">
                        {formatMoney(invoice.amount)}
                      </td>
                      <td className="py-3">
                        {formatMoney(invoice.paidAmount)}
                      </td>
                      <td className="py-3">
                        {formatMoney(invoice.balanceRemaining)}
                      </td>
                      <td className="py-3">
                        {formatDate(invoice.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Status Breakdown</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {data.invoiceStatusBreakdown.map((row) => (
                <div
                  key={row.status}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{row.status}</p>
                    <p className="text-sm text-muted-foreground">
                      {row.count} invoice(s)
                    </p>
                  </div>

                  <p className="font-semibold">
                    {formatMoney(row.totalAmount)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Overdue Invoices</CardTitle>
        </CardHeader>

        <CardContent>
          {data.overdueInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No overdue invoices for this supplier.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-3">Invoice</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Amount</th>
                    <th className="py-3">Owed</th>
                    <th className="py-3">Due Date</th>
                  </tr>
                </thead>

                <tbody>
                  {data.overdueInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b">
                      <td className="py-3 font-medium">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="py-3">{invoice.status}</td>
                      <td className="py-3">
                        {formatMoney(invoice.amount)}
                      </td>
                      <td className="py-3">
                        {formatMoney(invoice.balanceRemaining)}
                      </td>
                      <td className="py-3">
                        {formatDate(invoice.dueDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function KpiCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>

        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>

      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}