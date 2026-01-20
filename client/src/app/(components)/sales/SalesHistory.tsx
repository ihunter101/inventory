
// ============================================
// client/src/components/sales/SalesHistory.tsx
// ============================================
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetSalesByLocationQuery } from "@/app/state/api";
import { Skeleton } from "@/components/ui/skeleton";

export const SalesHistory = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
  });

  const { data, isLoading, error } = useGetSalesByLocationQuery(dateRange);

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(value));
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-[400px]" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <p className="text-red-800">Error loading sales history</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Sales History</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setDateRange({
                startDate: new Date(
                  Date.now() - 7 * 24 * 60 * 60 * 1000
                ).toISOString(),
                endDate: new Date().toISOString(),
              })
            }
          >
            Last 7 Days
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setDateRange({
                startDate: new Date(
                  Date.now() - 30 * 24 * 60 * 60 * 1000
                ).toISOString(),
                endDate: new Date().toISOString(),
              })
            }
          >
            Last 30 Days
          </Button>
        </div>
      </div>

      {!data?.sales || data.sales.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No sales records found for the selected period
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Cash</TableHead>
                <TableHead className="text-right">Credit Card</TableHead>
                <TableHead className="text-right">Debit Card</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">
                    {new Date(sale.salesDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(sale.cashTotal)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(sale.creditCardTotal)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(sale.debitCardTotal)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(sale.grandTotal)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                    {sale.notes || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
};