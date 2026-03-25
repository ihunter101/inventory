"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  DollarSign,
  Package,
  AlertCircle,
  FileText,
  Loader2,
  Calendar,
  ArrowUpRight,
  Percent,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useGenerateAIQuaterlyReportMutation } from "@/app/state/api";
import ReactMarkdown from "react-markdown";

export default function QuarterlyReportPage() {
  const currentYear = new Date().getFullYear();

  const [quarter, setQuarter] = useState<number>(1);
  const [year, setYear] = useState<number>(currentYear);

  const [generateReport, { data, isLoading, isError }] =
    useGenerateAIQuaterlyReportMutation();

  const handleGenerate = () => {
    generateReport({ quarter, year });
  };

  const formatCurrency = (value: number) =>
    `$${(value ?? 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatPercent = (value: number) =>
    `${((value ?? 0) * 100).toFixed(1)}%`;

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Laboratory Quarterly Analysis
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {data?.quarterName || "Select a quarter to generate report"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={quarter}
            onChange={(e) => setQuarter(Number(e.target.value))}
            className="border rounded-md px-3 py-2 bg-background"
          >
            <option value={1}>Q1</option>
            <option value={2}>Q2</option>
            <option value={3}>Q3</option>
            <option value={4}>Q4</option>
          </select>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border rounded-md px-3 py-2 bg-background"
          >
            {[currentYear, currentYear - 1, currentYear - 2, currentYear - 3].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            size="lg"
            className="shadow-md"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing AI Summary...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </div>

      <Separator />

      {isError && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6 flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to generate the report. Please check your API connection or OpenAI credits.</p>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
        </div>
      )}

      {!data && !isLoading && (
        <Card className="border-dashed flex flex-col items-center justify-center p-16 text-center bg-slate-50/50">
          <div className="rounded-full bg-white p-4 shadow-sm mb-4">
            <TrendingUp className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700">Ready for Insights?</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            We will aggregate data from your tables and use AI to produce a more structured financial and operational review.
          </p>
        </Card>
      )}

      {data && !isLoading && (
        <div className="grid gap-6 animate-in fade-in duration-500">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <StatsCard
              title="Total Revenue"
              value={formatCurrency(data.sales.totalRevenue)}
              icon={<DollarSign className="h-4 w-4 text-emerald-600" />}
              description={`${data.sales.entryCount} sales entries`}
            />

            <StatsCard
              title="Provisional COGS"
              value={formatCurrency(data.costing.provisionalCOGS)}
              icon={<Package className="h-4 w-4 text-blue-600" />}
              description={data.costing.method}
            />

            <StatsCard
              title="Est. Gross Profit"
              value={formatCurrency(data.costing.estimatedGrossProfit)}
              icon={<ArrowUpRight className="h-4 w-4 text-purple-600" />}
              description="Revenue less provisional COGS"
            />

            <StatsCard
              title="Est. Gross Margin"
              value={formatPercent(data.costing.estimatedGrossMargin)}
              icon={<Percent className="h-4 w-4 text-fuchsia-600" />}
              description="Provisional margin"
            />

            <StatsCard
              title="Stock Fill Rate"
              value={formatPercent(data.usage.fillRate)}
              icon={<ClipboardList className="h-4 w-4 text-orange-600" />}
              description={`${data.usage.totalGrantedQty} granted of ${data.usage.totalRequestedQty}`}
            />

            <StatsCard
              title="Supplier Coverage"
              value={formatPercent(data.derivedMetrics.supplierPaymentCoverageRatio)}
              icon={<TrendingUp className="h-4 w-4 text-cyan-600" />}
              description="Paid vs invoiced suppliers"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Financial Snapshot</CardTitle>
                <CardDescription>Core quarter-level management metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <MetricRow
                  label="Paid Expenses"
                  value={formatCurrency(data.expenses.totalPaidExpenses)}
                />
                <MetricRow
                  label="Inventory Received Value"
                  value={formatCurrency(data.purchasing.totalReceivedValue)}
                />
                <MetricRow
                  label="Total Invoiced"
                  value={formatCurrency(data.payables.totalInvoiced)}
                />
                <MetricRow
                  label="Total Paid to Suppliers"
                  value={formatCurrency(data.payables.totalPaid)}
                />
                <MetricRow
                  label="Outstanding Payables"
                  value={formatCurrency(data.payables.totalOutstanding)}
                />
                <MetricRow
                  label="Average Revenue per Sale"
                  value={formatCurrency(data.derivedMetrics.averageRevenuePerSale)}
                />
                <MetricRow
                  label="Estimated Operating Surplus"
                  value={formatCurrency(
                    data.derivedMetrics.estimatedOperatingSurplusAfterExpenses
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Mix</CardTitle>
                <CardDescription>Customer payment method distribution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <MetricRow
                  label="Cash"
                  value={`${formatCurrency(data.sales.totalCash)} (${formatPercent(
                    data.sales.paymentMix.cashPct
                  )})`}
                />
                <MetricRow
                  label="Credit Card"
                  value={`${formatCurrency(data.sales.totalCredit)} (${formatPercent(
                    data.sales.paymentMix.creditPct
                  )})`}
                />
                <MetricRow
                  label="Debit Card"
                  value={`${formatCurrency(data.sales.totalDebit)} (${formatPercent(
                    data.sales.paymentMix.debitPct
                  )})`}
                />
                <MetricRow
                  label="Cheque"
                  value={`${formatCurrency(data.sales.totalCheque)} (${formatPercent(
                    data.sales.paymentMix.chequePct
                  )})`}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Expense Categories</CardTitle>
                <CardDescription>
                  Top category share: {formatPercent(data.expenses.concentration.topCategoryShare)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.expenses.byCategory.length > 0 ? (
                  data.expenses.byCategory.slice(0, 5).map((item) => (
                    <MetricRow
                      key={item.category}
                      label={`${item.category} (${item.count})`}
                      value={formatCurrency(item.total)}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No paid expenses recorded for this quarter.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Issued Items</CardTitle>
                <CardDescription>Based on granted stock requests and estimated cost</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.usage.topIssuedItems.length > 0 ? (
                  data.usage.topIssuedItems.slice(0, 5).map((item) => (
                    <MetricRow
                      key={item.productId}
                      label={`${item.productName} (${item.totalGrantedQty} granted)`}
                      value={formatCurrency(item.estimatedCOGS)}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No stock usage activity recorded for this quarter.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Purchasing by Department</CardTitle>
                <CardDescription>Department-level purchasing concentration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.purchasing.byDepartment.length > 0 ? (
                  data.purchasing.byDepartment.slice(0, 5).map((item) => (
                    <MetricRow
                      key={item.department}
                      label={`${item.department} (${item.totalQty} qty)`}
                      value={formatCurrency(item.totalValue)}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No purchasing activity recorded for this quarter.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage by Location</CardTitle>
                <CardDescription>Estimated usage cost by requesting location</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.usage.byLocation.length > 0 ? (
                  data.usage.byLocation.slice(0, 5).map((item) => (
                    <MetricRow
                      key={item.location}
                      label={`${item.location} (${item.totalGrantedQty} granted)`}
                      value={formatCurrency(item.estimatedCOGS)}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No location usage activity recorded for this quarter.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-lg border-primary/10">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>AI Executive Summary</CardTitle>
                  <CardDescription>Intelligent Lab Business Analysis</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="prose prose-slate dark:prose-invert max-w-none 
                prose-h1:text-2xl prose-h1:font-semibold prose-h1:mt-8 prose-h1:mb-3
                prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-2
                prose-h3:text-base prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-1
                prose-p:my-2 prose-p:leading-7
                prose-li:my-1
                prose-table:text-sm
                prose-strong:font-semibold">
                <ReactMarkdown>
                  {data.aiSummary || "..."}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reporting Limitations</CardTitle>
              <CardDescription>Important accounting and data interpretation constraints</CardDescription>
            </CardHeader>
            <CardContent>
              {data.limitations.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                  {data.limitations.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No limitations were returned.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-md">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold break-words">{value}</div>
        <p className="text-xs text-muted-foreground mt-1 font-medium">{description}</p>
      </CardContent>
    </Card>
  );
}

function MetricRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}