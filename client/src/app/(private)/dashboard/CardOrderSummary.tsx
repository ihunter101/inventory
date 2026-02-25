"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, FileText, Clock, CheckCircle2 } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { useGetDashboardProcurementOverviewQuery } from "../../state/api";
import type { ProcurementTF } from "../../state/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CardProcurementOverview() {
  const [tf, setTf] = useState<ProcurementTF>("90d");
  const { data, isLoading, isError } = useGetDashboardProcurementOverviewQuery({ tf });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);

  const poStatusData = useMemo(() => {
    const by = data?.po.byStatus ?? [];
    // show only the big ones, optional:
    return by.map((x) => ({
      name: x.status,
      value: x.count,
    }));
  }, [data?.po.byStatus]);

  const invoiceStatusData = useMemo(() => {
    const by = data?.invoices.byStatus ?? [];
    return by.map((x) => ({
      name: x.status,
      value: x.count,
    }));
  }, [data?.invoices.byStatus]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white p-2 border border-slate-200 rounded shadow-sm">
        <div className="text-xs font-semibold text-slate-900">{payload[0].name}</div>
        <div className="text-xs text-slate-600">{payload[0].value}</div>
      </div>
    );
  };

  if (isError) {
    return (
      <Card className="h-full rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-center">
        <div className="text-sm text-slate-500">Failed to load procurement overview</div>
      </Card>
    );
  }

  return (
    <Card className="h-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">
              Procurement Overview
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              {data?.rangeLabel ?? "—"}
            </p>
          </div>

          <Select value={tf} onValueChange={(v) => setTf(v as ProcurementTF)}>
            <SelectTrigger className="h-9 w-[120px] rounded-full border border-slate-200 bg-white text-xs shadow-sm">
              <SelectValue placeholder="Last 90d" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Last 30d</SelectItem>
              <SelectItem value="90d">Last 90d</SelectItem>
              <SelectItem value="1y">Last 12m</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <div className="py-8 text-sm text-slate-500">Loading...</div>
        ) : (
          <div className="space-y-4">
            {/* ✅ TOP KPI ROW (ONLY 2 CARDS) */}
            <div className="grid grid-cols-2 gap-3">
              {/* POs */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-blue-700">Purchase Orders</p>
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                </div>
                <p className="mt-1 text-2xl font-extrabold text-blue-900">{data?.po.total ?? 0}</p>
                <p className="mt-1 text-xs text-blue-700">
                  Active: {data?.po.active ?? 0} • Closed: {data?.po.closed ?? 0}
                </p>
                <p className="mt-1 text-xs font-semibold text-blue-900">
                  Active value: {formatCurrency(data?.po.activeValue ?? 0)}
                </p>
              </div>

              {/* Invoices */}
              <div className="rounded-2xl border border-purple-100 bg-purple-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-purple-700">Invoices</p>
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
                <p className="mt-1 text-2xl font-extrabold text-purple-900">{data?.invoices.total ?? 0}</p>
                <p className="mt-1 text-xs text-purple-700">
                  Pending: {data?.invoices.pending ?? 0} • Paid: {data?.invoices.paid ?? 0}
                </p>
                <p className="mt-1 text-xs font-semibold text-purple-900">
                  Total: {formatCurrency(data?.invoices.totalAmount ?? 0)}
                </p>
              </div>
            </div>

            {/* ✅ DONUTS */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold text-slate-700 mb-2">PO Status</p>
                <div className="h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={poStatusData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={38}
                        outerRadius={62}
                        paddingAngle={2}
                      >
                        {poStatusData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7"][i % 5]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold text-slate-700 mb-2">Invoice Status</p>
                <div className="h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={invoiceStatusData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={38}
                        outerRadius={62}
                        paddingAngle={2}
                      >
                        {invoiceStatusData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#a855f7"][i % 5]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* ✅ AMOUNT STRIP (PAID / PENDING) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm text-slate-700">Paid Invoices</p>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {formatCurrency(data?.invoices.paidAmount ?? 0)}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <p className="text-sm text-slate-700">Pending Invoices</p>
                </div>
                <p className="text-sm font-semibold text-amber-700">
                  {formatCurrency(data?.invoices.pendingAmount ?? 0)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}