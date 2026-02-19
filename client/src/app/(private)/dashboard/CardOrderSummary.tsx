// CardOrderSummary.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, FileText, Clock, CheckCircle2 } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PurchaseMetrics } from "@/app/state/api";

interface CardOrderSummaryProps {
  metrics?: PurchaseMetrics;
}

export default function CardOrderSummary({ metrics }: CardOrderSummaryProps) {
  if (!metrics) {
    return (
      <Card className="h-full flex items-center justify-center shadow-sm">
        <div className="text-gray-500 text-sm">Loading order data...</div>
      </Card>
    );
  }

  // Data for PO Status Pie Chart
  const poStatusData = [
    { name: "Closed", value: metrics.closedPOs, color: "#10b981" },
    { name: "Active", value: metrics.activePOs, color: "#3b82f6" },
  ];

  // Data for Invoice Status Pie Chart
  const invoiceStatusData = [
    { name: "Paid", value: metrics.paidInvoices, color: "#10b981" },
    { name: "Pending", value: metrics.pendingInvoices, color: "#f59e0b" },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
          <p className="text-sm font-semibold">{payload[0].name}</p>
          <p className="text-sm text-gray-600">{payload[0].value} orders</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full flex flex-col shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-blue-600" />
          Order Summary
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Top Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total POs */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-blue-700">Purchase Orders</span>
              <ShoppingCart className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-900">{metrics.totalPOs}</div>
            <div className="text-xs text-blue-600 mt-1">
              {metrics.closedPOs} closed • {metrics.activePOs} active
            </div>
          </div>

          {/* Total Invoices */}
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-purple-700">Invoices</span>
              <FileText className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-900">{metrics.totalInvoices}</div>
            <div className="text-xs text-purple-600 mt-1">
              {formatCurrency(metrics.totalInvoicesAmount)}
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-3 flex-1">
          {/* PO Status Chart */}
          <div className="flex flex-col">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">PO Status</h4>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={poStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {poStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Invoice Status Chart */}
          <div className="flex flex-col">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Invoice Status</h4>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={invoiceStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {invoiceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Invoice Amount Details */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-700">Paid Invoices</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                {formatCurrency(metrics.paidInvoicesAmount)}
              </div>
              <div className="text-xs text-gray-500">{metrics.paidInvoices} invoices</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-gray-700">Pending Invoices</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-orange-600">
                {formatCurrency(metrics.pendingInvoicesAmount)}
              </div>
              <div className="text-xs text-gray-500">{metrics.pendingInvoices} invoices</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}