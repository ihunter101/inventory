"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetQuickBooksSummaryQuery } from "@/app/state/api";

export default function QuickbooksSyncStatus() {
  const { data, isLoading, isError } = useGetQuickBooksSummaryQuery();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading summary...</p>;
  }

  if (isError) {
    return <p className="text-sm text-red-500">Failed to load QuickBooks summary.</p>;
  }

  const cards = [
    { title: "Customers", value: data?.customerCount ?? 0 },
    { title: "Invoices", value: data?.invoiceCount ?? 0 },
    { title: "Payments Received", value: data?.paymentCount ?? 0 },
    { title: "Cheques Paid", value: data?.chequeCount ?? 0 },
    { title: "Open Invoices", value: data?.unpaidInvoiceCount ?? 0 },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title} className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{card.value}</p>
              <Badge variant="secondary">QB</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}