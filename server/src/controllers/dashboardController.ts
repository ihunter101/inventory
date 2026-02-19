//controller defines the logic of what happens when a route requested

import { Request, Response } from "express";
import { prisma } from "../lib/prisma";



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

// Updated section for getDashbaordMetrics function
// Replace the purchaseBreakdown section in your controller with this:

// Updated section for getDashbaordMetrics function
// Replace the purchaseBreakdown section in your controller with this:

export const getDashboardMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const popularProducts = await prisma.products.findMany({
      take: 15,
      orderBy: { stockQuantity: "desc" },
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

    // ✅ 5. RETURN ALL METRICS INCLUDING NEW PURCHASE ORDER METRICS
    res.json({
      popularProducts,
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
      }))
    });

  } catch (error) {
    console.error("Dashboard metrics error:", error);
    res.status(500).json({ message: "Error retrieving dashboard metrics" });
  }
};




