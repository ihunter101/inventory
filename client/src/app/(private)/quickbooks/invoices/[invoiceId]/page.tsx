"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, User, CalendarDays, DollarSign } from "lucide-react";
import { useGetQuickBooksInvoiceByIdQuery } from "@/app/state/api";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

function money(value: unknown) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function date(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
}

function statusVariant(status?: string) {
  if (status === "PAID") return "default";
  if (status === "PARTIALLY_PAID") return "secondary";
  if (status === "OVERDUE") return "destructive";
  return "outline";
}

export default function QuickBooksInvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();

  const invoiceId = params.invoiceId as string;

  const {
    data: invoice,
    isLoading,
    isError,
  } = useGetQuickBooksInvoiceByIdQuery(invoiceId, {
    skip: !invoiceId,
  });

  if (isLoading) {
    return (
      <main className="p-6">
        <p className="text-sm text-muted-foreground">Loading invoice...</p>
      </main>
    );
  }

  if (isError || !invoice) {
    return (
      <main className="p-6 space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-red-500">Failed to load invoice.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const lines = invoice.lines ?? [];

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Badge variant={statusVariant(invoice.status) as any}>
          {invoice.status ?? "UNKNOWN"}
        </Badge>
      </div>

      <section className="rounded-3xl border bg-gradient-to-br from-background via-background to-muted/40 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Invoice #{invoice.invoiceNumber ?? invoice.qbTxnNumber ?? "-"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  QuickBooks Desktop synced invoice with service line details.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MetricCard
              label="Total"
              value={money(invoice.totalAmount)}
              icon={<DollarSign className="h-4 w-4" />}
            />
            <MetricCard
              label="Paid"
              value={money(invoice.amountPaid)}
              icon={<DollarSign className="h-4 w-4" />}
            />
            <MetricCard
              label="Balance"
              value={money(invoice.balanceRemaining)}
              icon={<DollarSign className="h-4 w-4" />}
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="rounded-2xl xl:col-span-2">
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
            <CardDescription>
              Services, classes, quantities, rates, and amounts pulled from QuickBooks.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Service Date</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {lines.map((line: any) => (
                    <TableRow key={line.lineId}>
                      <TableCell className="font-medium">
                        {line.itemName ?? "-"}
                      </TableCell>

                      <TableCell className="max-w-[320px] text-muted-foreground">
                        {line.description ?? "-"}
                      </TableCell>

                      <TableCell>{line.className ?? "-"}</TableCell>

                      <TableCell>{date(line.serviceDate)}</TableCell>

                      <TableCell className="text-right">
                        {line.quantity ?? "-"}
                      </TableCell>

                      <TableCell className="text-right">
                        {line.rate ? money(line.rate) : "-"}
                      </TableCell>

                      <TableCell className="text-right font-medium">
                        {money(line.amount)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {lines.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-muted-foreground"
                      >
                        No line items found for this invoice.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Customer</CardTitle>
              <CardDescription>Billing information from QuickBooks.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <InfoRow
                icon={<User className="h-4 w-4" />}
                label="Customer"
                value={invoice.customerName}
              />

              <Separator />

              <div className="space-y-2 text-sm">
                <p className="font-medium">Billing Details</p>
                <div className="text-muted-foreground space-y-1">
                  <p>{invoice.customerDetail1 ?? "-"}</p>
                  {invoice.customerDetail2 && <p>{invoice.customerDetail2}</p>}
                  {invoice.customerDetail3 && <p>{invoice.customerDetail3}</p>}
                  {invoice.customerDetail4 && <p>{invoice.customerDetail4}</p>}
                  {invoice.customerDetail5 && <p>{invoice.customerDetail5}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
              <CardDescription>Dates, terms, and QuickBooks metadata.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <InfoRow
                icon={<CalendarDays className="h-4 w-4" />}
                label="Invoice Date"
                value={date(invoice.invoiceDate)}
              />

              <InfoRow
                icon={<CalendarDays className="h-4 w-4" />}
                label="Due Date"
                value={date(invoice.dueDate)}
              />

              <Separator />

              <PlainRow label="Terms" value={invoice.termsName} />
              <PlainRow label="Sales Rep" value={invoice.salesRepName} />
              <PlainRow label="A/R Account" value={invoice.arAccountName} />
              <PlainRow label="Memo" value={invoice.memo} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-muted p-2 text-muted-foreground">
        {icon}
      </div>

      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || "-"}</p>
      </div>
    </div>
  );
}

function PlainRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value || "-"}</span>
    </div>
  );
}