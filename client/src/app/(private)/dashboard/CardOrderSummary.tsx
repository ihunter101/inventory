"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, FileText, Clock, CheckCircle2 } from "lucide-react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { useGetDashboardProcurementOverviewQuery } from "../../state/api";
import type { ProcurementTF } from "../../state/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7"];

export default function CardProcurementOverview() {
  const [tf, setTf] = useState<ProcurementTF>("90d");
  const { data, isLoading, isError } =
    useGetDashboardProcurementOverviewQuery({ tf });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);

  const poStatusData = useMemo(() => {
    const by = data?.po.byStatus ?? [];
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
      <div className="rounded-xl border border-border/60 bg-popover/95 p-3 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-popover/90">
        <div className="text-xs font-semibold text-popover-foreground">
          {payload[0].name}
        </div>
        <div className="text-xs text-muted-foreground">{payload[0].value}</div>
      </div>
    );
  };

  const renderScrollableLegend = (props: any) => {
    const { payload } = props;

    if (!payload?.length) return null;

    return (
      <div className="max-h-[64px] overflow-y-auto pr-1">
        <div className="flex flex-col gap-1">
          {payload.map((entry: any, index: number) => (
            <div
              key={`legend-${index}`}
              className="flex items-start gap-2 text-[11px] leading-tight"
            >
              <span
                className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="break-words text-muted-foreground">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isError) {
    return (
      <Card className="flex h-full items-center justify-center rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="text-sm text-muted-foreground">
          Failed to load procurement overview
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/95">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight text-foreground">
              Procurement Overview
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {data?.rangeLabel ?? "—"}
            </p>
          </div>

          <Select value={tf} onValueChange={(v) => setTf(v as ProcurementTF)}>
            <SelectTrigger className="h-9 w-[120px] rounded-full border border-border/60 bg-background text-xs text-foreground shadow-sm">
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
          <div className="py-8 text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-primary/15 bg-primary/10 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-primary">
                    Purchase Orders
                  </p>
                  <ShoppingCart className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-1 text-2xl font-extrabold text-foreground">
                  {data?.po.total ?? 0}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Active: {data?.po.active ?? 0} • Closed: {data?.po.closed ?? 0}
                </p>
                <p className="mt-1 text-xs font-semibold text-foreground">
                  Active value: {formatCurrency(data?.po.activeValue ?? 0)}
                </p>
              </div>

              <div className="rounded-2xl border border-purple-200/40 bg-purple-500/10 p-3 dark:border-purple-900/40 dark:bg-purple-950/30">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-purple-700 dark:text-purple-300">
                    Invoices
                  </p>
                  <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="mt-1 text-2xl font-extrabold text-foreground">
                  {data?.invoices.total ?? 0}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pending: {data?.invoices.pending ?? 0} • Paid: {data?.invoices.paid ?? 0}
                </p>
                <p className="mt-1 text-xs font-semibold text-foreground">
                  Total: {formatCurrency(data?.invoices.totalAmount ?? 0)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
                <p className="mb-2 text-xs font-semibold text-foreground">
                  PO Status
                </p>

                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <Pie
                        data={poStatusData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={34}
                        outerRadius={58}
                        paddingAngle={4}
                        cx="50%"
                        cy="35%"
                      >
                        {poStatusData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        content={renderScrollableLegend}
                        wrapperStyle={{
                          bottom: 0,
                          left: 0,
                          right: 0,
                          paddingTop: 8,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
                <p className="mb-2 text-xs font-semibold text-foreground">
                  Invoice Status
                </p>

                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <Pie
                        data={invoiceStatusData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={34}
                        outerRadius={58}
                        paddingAngle={4}
                        cx="50%"
                        cy="35%"
                      >
                        {invoiceStatusData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        content={renderScrollableLegend}
                        wrapperStyle={{
                          bottom: 0,
                          left: 0,
                          right: 0,
                          paddingTop: 8,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm text-foreground">Paid Invoices</p>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(data?.invoices.paidAmount ?? 0)}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <p className="text-sm text-foreground">Pending Invoices</p>
                </div>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
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