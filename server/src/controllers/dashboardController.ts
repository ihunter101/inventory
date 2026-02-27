//controller defines the logic of what happens when a route requested

import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client"



type DateRange = "7d" | "30d" | "90d" | "1y";

function startOfDayUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function dayKeyUTC(d: Date) {
  return startOfDayUTC(d).toISOString().slice(0, 10); // YYYY-MM-DD
}

function addDaysUTC(d: Date, days: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

function buildDayList(start: Date, end: Date) {
  const days: string[] = [];
  let cur = startOfDayUTC(start);
  const last = startOfDayUTC(end);
  while (cur <= last) {
    days.push(cur.toISOString().slice(0, 10));
    cur = addDaysUTC(cur, 1);
  }
  return days;
}

async function computeRevenueAndProfit(range: DateRange) {
  const end = new Date();
  const endDay = startOfDayUTC(end);

  const daysBack =
    range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;

  // current window: [start, end]
  const start = addDaysUTC(endDay, -daysBack + 1);

  // previous window of same length
  const prevEnd = addDaysUTC(start, -1);
  const prevStart = addDaysUTC(prevEnd, -daysBack + 1);

  // Query raw rows (minimal selects)
  const [salesRows, expenseRows, invoiceRows, prevSalesRows, prevExpenseRows, prevInvoiceRows] =
    await Promise.all([
      prisma.sale.findMany({
        where: { salesDate: { gte: start, lte: endDay } },
        select: { salesDate: true, grandTotal: true },
      }),
      prisma.expenses.findMany({
        where: { date: { gte: start, lte: endDay } },
        select: { date: true, amount: true, category: true },
      }),
      prisma.supplierInvoice.findMany({
        where: { date: { gte: start, lte: endDay } },
        select: { date: true, amount: true },
      }),

      prisma.sale.findMany({
        where: { salesDate: { gte: prevStart, lte: prevEnd } },
        select: { grandTotal: true },
      }),
      prisma.expenses.findMany({
        where: { date: { gte: prevStart, lte: prevEnd } },
        select: { amount: true },
      }),
      prisma.supplierInvoice.findMany({
        where: { date: { gte: prevStart, lte: prevEnd } },
        select: { amount: true },
      }),
    ]);

  // Build per-day buckets so chart always has continuous x-axis
  const days = buildDayList(start, endDay);
  const revenueByDay = new Map<string, number>();
  const regularByDay = new Map<string, number>();
  const invoiceByDay = new Map<string, number>();

  for (const d of days) {
    revenueByDay.set(d, 0);
    regularByDay.set(d, 0);
    invoiceByDay.set(d, 0);
  }

  // Fill buckets
  for (const s of salesRows) {
    const key = dayKeyUTC(new Date(s.salesDate));
    revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + Number(s.grandTotal));
  }

  for (const e of expenseRows) {
    const key = dayKeyUTC(new Date(e.date));
    regularByDay.set(key, (regularByDay.get(key) ?? 0) + Number(e.amount));
  }

  for (const inv of invoiceRows) {
    const key = dayKeyUTC(new Date(inv.date));
    invoiceByDay.set(key, (invoiceByDay.get(key) ?? 0) + Number(inv.amount));
  }

  const chartData = days.map((d) => {
    const revenue = revenueByDay.get(d) ?? 0;
    const regularExpenses = regularByDay.get(d) ?? 0;
    const invoiceExpenses = invoiceByDay.get(d) ?? 0;
    const totalExpenses = regularExpenses + invoiceExpenses;
    const profit = revenue - totalExpenses;

    return {
      date: d,
      revenue: Number(revenue.toFixed(2)),
      regularExpenses: Number(regularExpenses.toFixed(2)),
      invoiceExpenses: Number(invoiceExpenses.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      profit: Number(profit.toFixed(2)),
    };
  });

  const totalRevenue = chartData.reduce((a, x) => a + x.revenue, 0);
  const totalRegularExpenses = chartData.reduce((a, x) => a + x.regularExpenses, 0);
  const totalInvoiceExpenses = chartData.reduce((a, x) => a + x.invoiceExpenses, 0);
  const totalExpenses = totalRegularExpenses + totalInvoiceExpenses;
  const totalProfit = totalRevenue - totalExpenses;

  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Trends vs previous window
  const prevRevenue = prevSalesRows.reduce((a, x) => a + Number(x.grandTotal), 0);
  const prevRegular = prevExpenseRows.reduce((a, x) => a + Number(x.amount), 0);
  const prevInvoice = prevInvoiceRows.reduce((a, x) => a + Number(x.amount), 0);
  const prevExpenses = prevRegular + prevInvoice;
  const prevProfit = prevRevenue - prevExpenses;

  const revenueTrend = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : null;
  const profitTrend =
    prevProfit !== 0 ? ((totalProfit - prevProfit) / Math.abs(prevProfit)) * 100 : null;

  // Top expense categories (regular categories + "Invoices")
  const catTotals = new Map<string, number>();
  for (const e of expenseRows) {
    const cat = (e.category || "Uncategorized").trim();
    catTotals.set(cat, (catTotals.get(cat) ?? 0) + Number(e.amount));
  }
  const invoiceTotal = invoiceRows.reduce((a, x) => a + Number(x.amount), 0);
  if (invoiceTotal > 0) catTotals.set("Invoices", (catTotals.get("Invoices") ?? 0) + invoiceTotal);

  const topExpenseCategories = Array.from(catTotals.entries())
    .map(([category, amount]) => ({ category, amount: Number(amount.toFixed(2)) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    chartData,
    summary: {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalRegularExpenses: Number(totalRegularExpenses.toFixed(2)),
      totalInvoiceExpenses: Number(totalInvoiceExpenses.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      totalProfit: Number(totalProfit.toFixed(2)),
      profitMargin: Number(profitMargin.toFixed(1)),
      revenueTrend: revenueTrend === null ? null : Number(revenueTrend.toFixed(1)),
      profitTrend: profitTrend === null ? null : Number(profitTrend.toFixed(1)),
      transactionCounts: {
        salesCount: salesRows.length,
        expenseCount: expenseRows.length,
        invoiceCount: invoiceRows.length,
      },
    },
    topExpenseCategories,
  };
}



function toMoney(n: number) {
  return Number((Number.isFinite(n) ? n : 0).toFixed(2));
}

type SalesTimeframe = "daily" | "weekly" | "monthly";

function safeNum(v: any) {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function parseTimeframe(input: any): SalesTimeframe {
  if (input === "daily" || input === "weekly" || input === "monthly") return input;
  return "weekly";
}

function parseDateOrNull(v: any): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}


function pctChange(prev: number, curr: number): number | null {
  if (prev <= 0) return null;
  return ((curr - prev) / prev) * 100;
}


// Updated section for getDashbaordMetrics function
// Replace the purchaseBreakdown section in your controller with this:

// Updated section for getDashbaordMetrics function
// Replace the purchaseBreakdown section in your controller with this:

export const getDashboardMetrics = async (req: Request, res: Response): Promise<void> => {
  try {

     const timeframe = parseTimeframe(req.query.salesTf); // "daily" | "weekly" | "monthly"
    const qs = parseDateOrNull(req.query.salesStartDate);
    const qe = parseDateOrNull(req.query.salesEndDate);


    // Optional location filter (if you want to show KPI for one location)
    const locationId =
      req.query.locationId != null && String(req.query.locationId).trim() !== ""
        ? Number(req.query.locationId)
        : null;


    const issuedAggs = await prisma.stockRequestLine.groupBy({
      by: ["productId"],
      where: {
        grantedQty: { not: null, gt: 0 },
        stockRequest: {
          status: { in: ["FULFILLED"]}
        },
        outcome: { in: ["GRANTED", "ADJUSTED"] },
      },
      _sum: { grantedQty: true },
      orderBy: { _sum: { grantedQty: "desc" } },
      take: 15
    })

    const issuedProductIds = issuedAggs.map(p => p.productId)

    const issuedProducts = await prisma.products.findMany({
      where: { productId: { in: issuedProductIds } },
      select: { productId: true, name: true, category: true, Department: true, rating: true, unit: true, imageUrl: true }
    })

    const prodMap = new Map(issuedProducts.map(p => [p.productId, p]))

    const popularIssuedProducts = issuedAggs.map(row => {
  const p = prodMap.get(row.productId);
  return {
    productId: row.productId,
    name: p?.name ?? "Unknown Product",
    category: p?.category ?? null,
    department: p?.Department ?? null,
    unit: p?.unit ?? null,
    rate: p?.rating,
    imageUrl: p?.imageUrl,
    qtyIssued: row._sum.grantedQty ?? 0,
  };
});
    // ✅ 1. FETCH INVOICES WITH THE PROMOTION CHAIN
    const invoices = await prisma.supplierInvoice.findMany({
      take: 50,
      orderBy: { date: "desc" },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
            draftProduct: true,
            poItem: {
              include: {
                promotedProduct: true,
              },
            },
          },
        },
      },
    });

    // ✅ 2. PROCESSING THE BREAKDOWN
    const byCategory = new Map<string, number>();
    const byDepartment = new Map<string, number>();
    const byProduct = new Map<string, { productId: string; name: string; amount: number }>();
    let totalPurchases = 0;

    for (const inv of invoices) {
      for (const it of inv.items) {
        const lineTotal = Number(it.lineTotal) || (Number(it.quantity) * Number(it.unitPrice));
        if (lineTotal <= 0) continue;

        totalPurchases += lineTotal;

        const realProduct = it.product || it.poItem?.promotedProduct;
        const category = realProduct?.category?.trim() || "Draft Items";
        const department = (realProduct as any)?.Department || "Unassigned";

        byCategory.set(category, (byCategory.get(category) ?? 0) + lineTotal);
        byDepartment.set(department, (byDepartment.get(department) ?? 0) + lineTotal);

        const pId = realProduct?.productId || it.draftProductId || `unknown-${it.id}`;
        const pName = realProduct?.name || it.draftProduct?.name || it.description || "Unknown Item";
        
        const existing = byProduct.get(pId);
        if (!existing) {
          byProduct.set(pId, { productId: pId, name: pName, amount: lineTotal });
        } else {
          existing.amount += lineTotal;
        }
      }
    }

    const purchaseBreakdown = {
      total: toMoney(totalPurchases),
      byCategory: Array.from(byCategory.entries())
        .map(([category, amount]) => ({ category, amount: toMoney(amount) }))
        .sort((a, b) => b.amount - a.amount),
      byDepartment: Array.from(byDepartment.entries())
        .map(([department, amount]) => ({ department, amount: toMoney(amount) }))
        .sort((a, b) => b.amount - a.amount),
      topProducts: Array.from(byProduct.values())
        .map((p) => ({ ...p, amount: toMoney(p.amount) }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 8),
    };

    // 3. EXPENSES & REVENUE (Existing logic)
    const expenseSummary = await prisma.expenses.findMany({
      take: 50,
      orderBy: { date: "desc" },
    });

    const revenueAndProfit = {
      "7d": await computeRevenueAndProfit("7d"),
      "30d": await computeRevenueAndProfit("30d"),
      "90d": await computeRevenueAndProfit("90d"),
      "1y": await computeRevenueAndProfit("1y"),
    };

    // ✅ 4. NEW: PURCHASE ORDER METRICS
    const [totalPOs, closedPOs] = await Promise.all([
      prisma.purchaseOrder.count(),
      prisma.purchaseOrder.count({
        where: { status: "CLOSED" }
      })
    ]);

    const activePOs = totalPOs - closedPOs;

    const [allInvoices, invoiceAggregates] = await Promise.all([
      prisma.supplierInvoice.findMany({
        select: {
          status: true,
          amount: true,
        }
      }),
      prisma.supplierInvoice.groupBy({
        by: ['status'],
        _count: {
          id: true
        },
        _sum: {
          amount: true
        }
      })
    ]);

    const totalInvoices = allInvoices.length;
    
    const pendingInvoiceData = invoiceAggregates.find(agg => agg.status === 'PENDING');
    const paidInvoiceData = invoiceAggregates.find(agg => agg.status === 'PAID');
    
    const pendingInvoices = pendingInvoiceData?._count.id || 0;
    const paidInvoices = paidInvoiceData?._count.id || 0;
    
    const pendingInvoicesAmount = Number(pendingInvoiceData?._sum.amount || 0);
    const paidInvoicesAmount = Number(paidInvoiceData?._sum.amount || 0);
    const totalInvoicesAmount = pendingInvoicesAmount + paidInvoicesAmount;

    const purchaseOrderMetrics = {
      totalPOs,
      closedPOs,
      activePOs,
      totalInvoices,
      pendingInvoices,
      paidInvoices,
      pendingInvoicesAmount,
      paidInvoicesAmount,
      totalInvoicesAmount,
    };

    // SALES KPI Query
    // 5.1) Totals across range (optionally filtered by location)
    // ==============================
// SALES KPIs (weekly default, last 90 days)
// ==============================
const end = new Date();
const start = new Date();
start.setDate(end.getDate() - 90); // ~13 weeks

// Totals
const totals = await prisma.sale.aggregate({
  where: { salesDate: { gte: start, lte: end } },
  _sum: {
    grandTotal: true,
    cashTotal: true,
    creditCardTotal: true,
    debitCardTotal: true,
    chequeTotal: true,
  },
});

const total = Number(totals._sum.grandTotal ?? 0);
const cash = Number(totals._sum.cashTotal ?? 0);
const nonCash =
  Number(totals._sum.creditCardTotal ?? 0) +
  Number(totals._sum.debitCardTotal ?? 0) +
  Number(totals._sum.chequeTotal ?? 0);

// Trend (weekly buckets)
const trendRows = await prisma.$queryRaw<
  Array<{ bucket: Date; grandtotal: any }>
>`
  SELECT
    date_trunc('week', "salesDate") AS bucket,
    SUM("grandTotal") AS grandTotal
  FROM "dailySales"
  WHERE "salesDate" >= ${start} AND "salesDate" <= ${end}
  GROUP BY 1
  ORDER BY 1 ASC;
`;

const trend = trendRows
  .map((r: any) => {
    const d = new Date(r.bucket);
    const label = d.toISOString().slice(0, 10); // YYYY-MM-DD week start
    return { label, total: Number(r.grandtotal ?? r.grandTotal ?? 0) };
  })
  .slice(-12);

// Latest % change
let latestChangePercent: number | null = null;
if (trend.length >= 2 && trend[trend.length - 2].total > 0) {
  const prev = trend[trend.length - 2].total;
  const curr = trend[trend.length - 1].total;
  latestChangePercent = ((curr - prev) / prev) * 100;
}

const salesSummary = {
  timeframe: "weekly" as const,
  total,
  cash,
  nonCash,
  latestChangePercent,
  trend,
};

    // ✅ 5. RETURN ALL METRICS INCLUDING NEW PURCHASE ORDER METRICS
    res.json({
      popularIssuedProducts,
      purchaseBreakdown,
      expenseSummary,
      revenueAndProfit,
      purchaseOrderMetrics, // ✅ Add this
      purchaseSummary: invoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: Number(inv.amount),
        date: inv.date.toISOString(),
        supplier: inv.supplier?.name
      })),
      salesSummary,
    });

  } catch (error) {
    console.error("Dashboard metrics error:", error);
    res.status(500).json({ message: "Error retrieving dashboard metrics" });
  }
};




type TF = "day" | "week" | "month";

function defaultRange(tf: TF) {
  const end = new Date();
  const start = new Date(end);

  if (tf === "day") start.setDate(end.getDate() - 14);        // last 14 days
  if (tf === "week") start.setDate(end.getDate() - 90);       // last ~13 weeks
  if (tf === "month") start.setFullYear(end.getFullYear() - 1); // last 12 months

  return { start, end };
}

function tfFromQuery(v: any): TF {
  return v === "week" ? "week" : "month";
}

function toNum(x: any) {
  const n = typeof x === "number" ? x : Number(x ?? 0);
  return Number.isFinite(n) ? n : 0;
}



export const getSalesOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const tf = tfFromQuery(req.query.tf);

    const end = new Date();
    let start = new Date(end);

    if (tf === "month") {
      start.setFullYear(end.getFullYear() - 1);
    } else {
      start = startOfWeekSunday(end); // current week Sunday 00:00
    }

    // Totals in range
    const totalsAgg = await prisma.sale.aggregate({
      where: { salesDate: { gte: start, lte: end } },
      _sum: {
        grandTotal: true,
        cashTotal: true,
        creditCardTotal: true,
        debitCardTotal: true,
        chequeTotal: true,
      },
    });

    const total = toNum(totalsAgg._sum.grandTotal);
    const cash = toNum(totalsAgg._sum.cashTotal);
    const nonCash =
      toNum(totalsAgg._sum.creditCardTotal) +
      toNum(totalsAgg._sum.debitCardTotal) +
      toNum(totalsAgg._sum.chequeTotal);

    // Sparse buckets
    const truncUnit = tf === "month" ? "month" : "day"; 
    // week mode buckets by day (Sun..Sat) so trunc('day') is correct

    const rows = await prisma.$queryRaw<
      Array<{ bucket: Date; total: any }>
    >(Prisma.sql`
      SELECT
        date_trunc(${truncUnit}, "salesDate") AS bucket,
        SUM("grandTotal") AS total
      FROM "dailySales"
      WHERE "salesDate" >= ${start} AND "salesDate" <= ${end}
      GROUP BY 1
      ORDER BY 1 ASC;
    `);

    const sparse = rows.map((r) => ({
      bucketISO: new Date(r.bucket).toISOString(), // keep full ISO
      total: toNum((r as any).total),
    }));

    // Highest bucket (from sparse)
    const highest =
      sparse.length > 0
        ? sparse.reduce((acc, cur) => (cur.total > acc.total ? cur : acc))
        : null;

    res.json({
      tf,
      rangeLabel: tf === "month" ? "Last 12 months" : "This week",
      totals: { total, cash, nonCash },
      highest: highest
        ? { bucketISO: highest.bucketISO, total: highest.total }
        : null,
      sparse,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error retrieving sales overview" });
  }
};


type PurchasesTimeFrame = "week" | "month" | "quarter";

function timeframeFromQuery(n: any): PurchasesTimeFrame {
  if (n === "week" || n === "month" || n === "quarter") return n;
  return "month";
}
function rangeFor(timeframe: PurchasesTimeFrame) {
  const end = new Date();
  const start = new Date(end);

  if (timeframe === "week") {
    // last 7 days (your choice)
    start.setDate(end.getDate() - 7);
  }

  if (timeframe === "month") {
    // last 12 months (including current month)
    start.setMonth(end.getMonth() - 11);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }

  if (timeframe === "quarter") {
    // last 4 months (your definition)
    start.setMonth(end.getMonth() - 3);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }

  return { start, end };
}

function startOfWeekSunday(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0=Sun
  x.setDate(x.getDate() - day);
  return x;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
const WEEK_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] as const;
const QUARTER_LABELS = ["Jan–Mar", "Apr–Jun", "Jul–Sep", "Oct–Dec"] as const;

function bucketIndexFor(timeframe: PurchasesTimeFrame, d: Date) {
  if (timeframe === "week") return d.getDay(); // 0 Sun ... 6 Sat
  if (timeframe === "month") return d.getMonth(); // 0 Jan ... 11 Dec
  // quarter
  return Math.floor(d.getMonth() / 3); // 0..3
}

function buildEmptySeries(timeframe: PurchasesTimeFrame) {
  if (timeframe === "week") {
    return WEEK_LABELS.map((label, i) => ({
      bucketISO: String(i), // doesn’t need to be ISO for fixed labels; keep string
      label,
      paid: 0,
    }));
  }

  if (timeframe === "month") {
    return MONTH_LABELS.map((label, i) => ({
      bucketISO: String(i),
      label,
      paid: 0,
    }));
  }

  // quarter
  return QUARTER_LABELS.map((label, i) => ({
    bucketISO: String(i),
    label,
    paid: 0,
  }));
}


export const getDashboardPurchaseSummary = async (req: Request, res: Response) => {
  try {
    const timeframe = timeframeFromQuery(req.query.timeframe);
    const { start, end } = rangeFor(timeframe);

    const payments = await prisma.invoicePayment.findMany({
      where: {
        status: "POSTED",
        paidAt: { gte: start, lte: end },
      },
      select: { paidAt: true, amount: true },
      orderBy: { paidAt: "asc" },
    });

    // ✅ fixed buckets
    const series = buildEmptySeries(timeframe);

    for (const p of payments) {
      const d = new Date(p.paidAt);
      const amt = Number(p.amount ?? 0);

      const idx = bucketIndexFor(timeframe, d);
      if (idx >= 0 && idx < series.length) {
        series[idx].paid += Number.isFinite(amt) ? amt : 0;
      }
    }

    // normalize decimals
    for (const row of series) row.paid = Number(row.paid.toFixed(2));

    const totals = {
      paid: Number(series.reduce((acc, x) => acc + x.paid, 0).toFixed(2)),
    };

    // --- status + outstanding (your existing logic) ---
    const invoiceAggs = await prisma.supplierInvoice.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { amount: true },
    });

    const paidRow = invoiceAggs.find((x) => x.status === "PAID");
    const pendingRow = invoiceAggs.find((x) => x.status === "PENDING");

    const invoicesPaid = paidRow?._count.id ?? 0;
    const invoicesPending = pendingRow?._count.id ?? 0;

    const statusPaidAmount = Number(paidRow?._sum.amount ?? 0);

    const pendingInvoices = await prisma.supplierInvoice.findMany({
      where: { status: "PENDING" },
      select: { balanceRemaining: true, amount: true },
    });

    const outstanding = pendingInvoices.reduce((acc, inv) => {
      const bal =
        inv.balanceRemaining != null ? Number(inv.balanceRemaining) : Number(inv.amount ?? 0);
      return acc + (Number.isFinite(bal) ? bal : 0);
    }, 0);

    const highest =
      series.length > 0 ? series.reduce((acc, cur) => (cur.paid > acc.paid ? cur : acc)) : null;

    res.json({
      timeframe,
      rangeLabel:
        timeframe === "week"
          ? "This week (Sun–Sat)"
          : timeframe === "month"
          ? "This year (Jan–Dec)"
          : "This year (Quarterly)",
      series,
      totals,
      status: {
        outstanding: Number(outstanding.toFixed(2)),
        paid: Number(statusPaidAmount.toFixed(2)),
        invoicesPending,
        invoicesPaid,
      },
      insights: {
        highest: highest ? { label: highest.label, paid: highest.paid } : null,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error retrieving purchase summary" });
  }
};




type ProcurementTF = "30d" | "90d" | "1y";

function _tfFromQuery(v: any): ProcurementTF {
  if (v === "30d" || v === "90d" || v === "1y") return v;
  return "90d";
}

function _rangeFor(tf: ProcurementTF) {
  const end = new Date();
  const start = new Date(end);

  if (tf === "30d") start.setDate(end.getDate() - 30);
  if (tf === "90d") start.setDate(end.getDate() - 90);
  if (tf === "1y") start.setFullYear(end.getFullYear() - 1);

  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export const getProcurementOverview = async (req: Request, res: Response) => {
  try {
    const tf = _tfFromQuery(req.query.tf);
    const { start, end } = _rangeFor(tf);

    // 1) POs summary (counts + totals by status)
    const poAgg = await prisma.purchaseOrder.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { total: true },
      where: { orderDate: { gte: start, lte: end } },
    });

    const totalPOs = poAgg.reduce((acc, x) => acc + (x._count.id ?? 0), 0);
    const closedPOs =
      poAgg.find((x) => x.status === "CLOSED")?._count.id ?? 0;

    const activePOs = totalPOs - closedPOs;

    // active value = sum totals for NON-CLOSED POs in range
    const activePOValue = poAgg.reduce((acc, x) => {
      if (x.status === "CLOSED") return acc;
      return acc + Number(x._sum.total ?? 0);
    }, 0);

    const poByStatus = poAgg
      .map((x) => ({
        status: x.status as string,
        count: x._count.id ?? 0,
        total: Number(x._sum.total ?? 0),
      }))
      .sort((a, b) => b.count - a.count);

    // 2) Invoices summary (counts + amounts by status)
    const invAgg = await prisma.supplierInvoice.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { amount: true },
      where: { date: { gte: start, lte: end } },
    });

    const totalInvoices = invAgg.reduce((acc, x) => acc + (x._count.id ?? 0), 0);

    const paidInvoices = invAgg.find((x) => x.status === "PAID")?._count.id ?? 0;
    const pendingInvoices =
      invAgg.find((x) => x.status === "PENDING")?._count.id ?? 0;

    const paidInvoicesAmount =
      Number(invAgg.find((x) => x.status === "PAID")?._sum.amount ?? 0);

    const pendingInvoicesAmount =
      Number(invAgg.find((x) => x.status === "PENDING")?._sum.amount ?? 0);

    const totalInvoicesAmount = Number(
      invAgg.reduce((acc, x) => acc + Number(x._sum.amount ?? 0), 0).toFixed(2)
    );

    const invoiceByStatus = invAgg
      .map((x) => ({
        status: x.status as string,
        count: x._count.id ?? 0,
        total: Number(x._sum.amount ?? 0),
      }))
      .sort((a, b) => b.count - a.count);

    res.json({
      tf,
      rangeLabel: tf === "30d" ? "Last 30 days" : tf === "90d" ? "Last 90 days" : "Last 12 months",

      po: {
        total: totalPOs,
        closed: closedPOs,
        active: activePOs,
        activeValue: Number(activePOValue.toFixed(2)),
        byStatus: poByStatus, // for donut
      },

      invoices: {
        total: totalInvoices,
        paid: paidInvoices,
        pending: pendingInvoices,
        paidAmount: Number(paidInvoicesAmount.toFixed(2)),
        pendingAmount: Number(pendingInvoicesAmount.toFixed(2)),
        totalAmount: Number(totalInvoicesAmount.toFixed(2)),
        byStatus: invoiceByStatus, // for donut
      },
    });
  } catch (e) {
    console.error("procurement overview error:", e);
    res.status(500).json({ message: "Error retrieving procurement overview" });
  }
};