import { prisma } from "../lib/prisma"; // adjust import
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";

function quarterlyBounds(date: Date = new Date()) {
  const month = date.getMonth();
  const year = date.getFullYear();

  const quarter = Math.floor(month / 3);
  const startMonth = quarter * 3;

  const start = new Date(year, startMonth, 1);
  const endExclusive = new Date(year, startMonth + 3, 1);

  return {
    start,
    endExclusive,
    quarterName: `Q${quarter + 1} - ${year}`,
  };
}

function toNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value == null) return 0;
  return Number(value);
}

function quarterlyBoundsFromSelection(quarter: number, year: number) {
  if (![1, 2, 3, 4].includes(quarter)) {
    throw new Error("Quarter must be 1, 2, 3, or 4");
  }

  const startMonth = (quarter - 1) * 3;

  const start = new Date(year, startMonth, 1);
  const endExclusive = new Date(year, startMonth + 3, 1);

  return {
    start,
    endExclusive,
    quarterName: `Q${quarter} - ${year}`,
  };
}

/**
 * Quarterly report for a given quarter, with the following data points:
 * - sales totals (grand total, cash, credit card, debit card, cheque)
 * - paid expenses (total, by category)
 * - purchasing activity (total received qty, total received value, top items, by department)
 * - supplier invoices (total invoiced, total outstanding, total paid, payments by method)
 * - simple summary metrics (gross operating surplus, net cash outflow known)
 * @returns {Promise<Response>} with quarterly report data
 */
// export const QuarterlyReport = async (quarter: number, year: number) => {
//   try {
//     const { start, endExclusive, quarterName } = quarterlyBoundsFromSelection(quarter, year);

//     const result = await prisma.$transaction(async (tx) => {
//       // 1) SALES TOTALS
//       const salesAgg = await tx.sale.aggregate({
//         where: {
//           salesDate: {
//             gte: start,
//             lt: endExclusive,
//           },
//         },
//         _sum: {
//           grandTotal: true,
//           cashTotal: true,
//           creditCardTotal: true,
//           debitCardTotal: true,
//           chequeTotal: true,
//         },
//         _count: {
//           id: true,
//         },
//       });

//       // 2) PAID EXPENSES
//       const paidExpenses = await tx.expenses.findMany({
//         where: {
//           date: {
//             gte: start,
//             lt: endExclusive,
//           },
//           status: "PAID",
//         },
//         select: {
//           category: true,
//           amount: true,
//           group: true,
//           description: true,
//         },
//       });

//       const totalPaidExpenses = paidExpenses.reduce(
//         (sum, e) => sum + Number(e.amount || 0),
//         0
//       );

//       const expenseCategoryMap = new Map<
//         string,
//         { category: string; total: number; count: number }
//       >();

//       for (const e of paidExpenses) {
//         const key = e.category || "Uncategorized";
//         const existing = expenseCategoryMap.get(key) ?? {
//           category: key,
//           total: 0,
//           count: 0,
//         };

//         existing.total += Number(e.amount || 0);
//         existing.count += 1;

//         expenseCategoryMap.set(key, existing);
//       }

//       const expensesByCategory = Array.from(expenseCategoryMap.values()).sort(
//         (a, b) => b.total - a.total
//       );

//       // 3) GOODS RECEIPT / PURCHASING ACTIVITY
//       // Filter through parent GRN date
//       const grnLines = await tx.goodsReceiptItem.findMany({
//         where: {
//           grn: {
//             date: {
//               gte: start,
//               lt: endExclusive,
//             },
//           },
//         },
//         select: {
//           productId: true,
//           productDraftId: true,
//           receivedQty: true,
//           unitPrice: true,
//           promotedProduct: {
//             select: {
//               productId: true,
//               name: true,
//               Department: true,
//             },
//           },
//           product: {
//             select: {
//               id: true,
//               name: true,
//             },
//           },
//         },
//       });

//       let totalReceivedQty = 0;
//       let totalReceivedValue = 0;

//       const itemMap = new Map<
//         string,
//         {
//           productId: string;
//           productName: string;
//           department: string | null;
//           totalQty: number;
//           totalValue: number;
//           unitPriceTotal: number;
//           unitPriceCount: number;
//         }
//       >();

//       const deptMap = new Map<
//         string,
//         {
//           department: string;
//           totalQty: number;
//           totalValue: number;
//         }
//       >();

//       for (const line of grnLines) {
//         const qty = Number(line.receivedQty || 0);
//         const unitPrice = toNumber(line.unitPrice);
//         const lineValue = qty * unitPrice;

//         totalReceivedQty += qty;
//         totalReceivedValue += lineValue;

//         const realProductId =
//           line.promotedProduct?.productId ?? line.productDraftId;
//         const productName =
//           line.promotedProduct?.name ?? line.product?.name ?? "Unknown Product";
//         const department = line.promotedProduct?.Department ?? "Unassigned";

//         const existingItem = itemMap.get(realProductId) ?? {
//           productId: realProductId,
//           productName,
//           department,
//           totalQty: 0,
//           totalValue: 0,
//           unitPriceTotal: 0,
//           unitPriceCount: 0,
//         };

//         existingItem.totalQty += qty;
//         existingItem.totalValue += lineValue;
//         existingItem.unitPriceTotal += unitPrice;
//         existingItem.unitPriceCount += 1;

//         itemMap.set(realProductId, existingItem);

//         const existingDept = deptMap.get(department) ?? {
//           department,
//           totalQty: 0,
//           totalValue: 0,
//         };

//         existingDept.totalQty += qty;
//         existingDept.totalValue += lineValue;

//         deptMap.set(department, existingDept);
//       }

//       const topItems = Array.from(itemMap.values())
//         .map((item) => ({
//           productId: item.productId,
//           productName: item.productName,
//           department: item.department,
//           totalQty: item.totalQty,
//           totalValue: item.totalValue,
//           avgUnitPrice:
//             item.unitPriceCount > 0
//               ? item.unitPriceTotal / item.unitPriceCount
//               : 0,
//         }))
//         .sort((a, b) => b.totalValue - a.totalValue)
//         .slice(0, 10);

//       const purchasingByDepartment = Array.from(deptMap.values()).sort(
//         (a, b) => b.totalValue - a.totalValue
//       );

//       // 4) SUPPLIER INVOICES / PAYABLES
//       const invoices = await tx.supplierInvoice.findMany({
//         where: {
//           date: {
//             gte: start,
//             lt: endExclusive,
//           },
//         },
//         select: {
//           amount: true,
//           balanceRemaining: true,
//           status: true,
//         },
//       });

//       const totalInvoiced = invoices.reduce(
//         (sum, inv) => sum + toNumber(inv.amount),
//         0
//       );

//       const totalOutstanding = invoices.reduce(
//         (sum, inv) => sum + toNumber(inv.balanceRemaining),
//         0
//       );

//       // 5) INVOICE PAYMENTS
//       const payments = await tx.invoicePayment.findMany({
//         where: {
//           paidAt: {
//             gte: start,
//             lt: endExclusive,
//           },
//         },
//         select: {
//           amount: true,
//           method: true,
//           status: true,
//         },
//       });

//       const totalPaid = payments.reduce(
//         (sum, p) => sum + toNumber(p.amount),
//         0
//       );

//       const paymentMethodMap = new Map<
//         string,
//         { method: string; total: number; count: number }
//       >();

//       for (const p of payments) {
//         const method = p.method || "Unknown";
//         const existing = paymentMethodMap.get(method) ?? {
//           method,
//           total: 0,
//           count: 0,
//         };

//         existing.total += toNumber(p.amount);
//         existing.count += 1;

//         paymentMethodMap.set(method, existing);
//       }

//       const paymentsByMethod = Array.from(paymentMethodMap.values()).sort(
//         (a, b) => b.total - a.total
//       );

//       // 6) SIMPLE SUMMARY METRICS
//       const totalRevenue = toNumber(salesAgg._sum.grandTotal);
//       const grossOperatingSurplus =
//         totalRevenue - totalPaidExpenses - totalReceivedValue;

//       const netCashOutflowKnown = totalPaidExpenses + totalPaid;

//       const averageRevenuePerSale =
//   salesAgg._count.id > 0 ? totalRevenue / salesAgg._count.id : 0;

// const provisionalGrossProfit = totalRevenue - totalReceivedValue;
// const provisionalGrossMargin =
//   totalRevenue > 0 ? provisionalGrossProfit / totalRevenue : 0;

// const supplierPaymentCoverage =
//   totalInvoiced > 0 ? totalPaid / totalInvoiced : 0;

//       return {
//         quarterName,
//         period: {
//           start,
//           endExclusive,
//         },
//         sales: {
//           totalRevenue,
//           totalCash: toNumber(salesAgg._sum.cashTotal),
//           totalCredit: toNumber(salesAgg._sum.creditCardTotal),
//           totalDebit: toNumber(salesAgg._sum.debitCardTotal),
//           totalCheque: toNumber(salesAgg._sum.chequeTotal),
//           entryCount: salesAgg._count.id,
//         },
//         expenses: {
//           totalPaidExpenses,
//           byCategory: expensesByCategory,
//         },
//         purchasing: {
//           totalReceivedQty,
//           totalReceivedValue,
//           topItems,
//           byDepartment: purchasingByDepartment,
//         },
//         payables: {
//           totalInvoiced,
//           totalOutstanding,
//           totalPaid,
//           paymentsByMethod,
//         },
//         derivedMetrics: {
//   averageRevenuePerSale,
//   provisionalGrossProfit,
//   provisionalGrossMargin,
//   supplierPaymentCoverage,
// },
//         summary: {
//           grossOperatingSurplus,
//           netCashOutflowKnown,
//         },
//       };
//     });

//     return result;
//   } catch (error) {
//     console.error("QuarterlyReport error:", error);
//     throw error;
//   }
// };





export const QuarterlyReport = async (quarter: number, year: number) => {
  try {
    const { start, endExclusive, quarterName } =
      quarterlyBoundsFromSelection(quarter, year);

    const result = await prisma.$transaction(async (tx) => {
      // =========================================================
      // 1) SALES TOTALS
      // =========================================================
      const salesAgg = await tx.sale.aggregate({
        where: {
          salesDate: {
            gte: start,
            lt: endExclusive,
          },
        },
        _sum: {
          grandTotal: true,
          cashTotal: true,
          creditCardTotal: true,
          debitCardTotal: true,
          chequeTotal: true,
        },
        _count: {
          id: true,
        },
      });

      const totalRevenue = toNumber(salesAgg._sum.grandTotal);
      const totalCash = toNumber(salesAgg._sum.cashTotal);
      const totalCredit = toNumber(salesAgg._sum.creditCardTotal);
      const totalDebit = toNumber(salesAgg._sum.debitCardTotal);
      const totalCheque = toNumber(salesAgg._sum.chequeTotal);
      const salesEntryCount = salesAgg._count.id ?? 0;

      // =========================================================
      // 2) PAID EXPENSES
      // =========================================================
      const paidExpenses = await tx.expenses.findMany({
        where: {
          createdAt: {
            gte: start,
            lt: endExclusive,
          },
          status: "PAID",
        },
        select: {
          category: true,
          amount: true,
          //group: true, TOT WHEN GROUP IS ADDED UNCOMMENT
          description: true,
        },
      });

      const totalPaidExpenses = paidExpenses.reduce(
        (sum, e) => sum + Number(e.amount || 0),
        0
      );

      const expenseCategoryMap = new Map<
        string,
        { category: string; total: number; count: number }
      >();

      for (const e of paidExpenses) {
        const key = e.category || "Uncategorized";
        const existing = expenseCategoryMap.get(key) ?? {
          category: key,
          total: 0,
          count: 0,
        };

        existing.total += Number(e.amount || 0);
        existing.count += 1;

        expenseCategoryMap.set(key, existing);
      }

      const expensesByCategory = Array.from(expenseCategoryMap.values()).sort(
        (a, b) => b.total - a.total
      );

      // =========================================================
      // 3) GOODS RECEIPT / PURCHASING ACTIVITY
      // =========================================================
      const grnLines = await tx.goodsReceiptItem.findMany({
        where: {
          grn: {
            date: {
              gte: start,
              lt: endExclusive,
            },
          },
        },
        select: {
          productId: true,
          productDraftId: true,
          receivedQty: true,
          unitPrice: true,
          promotedProduct: {
            select: {
              productId: true,
              name: true,
              Department: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
            },
          },
          grn: {
            select: {
              date: true,
            },
          },
        },
      });

      let totalReceivedQty = 0;
      let totalReceivedValue = 0;

      const itemMap = new Map<
        string,
        {
          productId: string;
          productName: string;
          department: string | null;
          totalQty: number;
          totalValue: number;
          unitPriceTotal: number;
          unitPriceCount: number;
        }
      >();

      const deptMap = new Map<
        string,
        {
          department: string;
          totalQty: number;
          totalValue: number;
        }
      >();

      for (const line of grnLines) {
        const qty = Number(line.receivedQty || 0);
        const unitPrice = toNumber(line.unitPrice);
        const lineValue = qty * unitPrice;

        totalReceivedQty += qty;
        totalReceivedValue += lineValue;

        const realProductId =
          line.promotedProduct?.productId ?? line.productDraftId;
        const productName =
          line.promotedProduct?.name ?? line.product?.name ?? "Unknown Product";
        const department = line.promotedProduct?.Department ?? "Unassigned";

        const existingItem = itemMap.get(realProductId) ?? {
          productId: realProductId,
          productName,
          department,
          totalQty: 0,
          totalValue: 0,
          unitPriceTotal: 0,
          unitPriceCount: 0,
        };

        existingItem.totalQty += qty;
        existingItem.totalValue += lineValue;
        existingItem.unitPriceTotal += unitPrice;
        existingItem.unitPriceCount += 1;

        itemMap.set(realProductId, existingItem);

        const existingDept = deptMap.get(department) ?? {
          department,
          totalQty: 0,
          totalValue: 0,
        };

        existingDept.totalQty += qty;
        existingDept.totalValue += lineValue;

        deptMap.set(department, existingDept);
      }

      const topItems = Array.from(itemMap.values())
        .map((item) => ({
          productId: item.productId,
          productName: item.productName,
          department: item.department,
          totalQty: item.totalQty,
          totalValue: item.totalValue,
          avgUnitPrice:
            item.unitPriceCount > 0
              ? item.unitPriceTotal / item.unitPriceCount
              : 0,
        }))
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 10);

      const purchasingByDepartment = Array.from(deptMap.values()).sort(
        (a, b) => b.totalValue - a.totalValue
      );

      // =========================================================
      // 4) SUPPLIER INVOICES / PAYABLES
      // =========================================================
      const invoices = await tx.supplierInvoice.findMany({
        where: {
          date: {
            gte: start,
            lt: endExclusive,
          },
        },
        select: {
          amount: true,
          balanceRemaining: true,
          status: true,
        },
      });

      const totalInvoiced = invoices.reduce(
        (sum, inv) => sum + toNumber(inv.amount),
        0
      );

      const totalOutstanding = invoices.reduce(
        (sum, inv) => sum + toNumber(inv.balanceRemaining),
        0
      );

      // =========================================================
      // 5) INVOICE PAYMENTS
      // =========================================================
      const payments = await tx.invoicePayment.findMany({
        where: {
          paidAt: {
            gte: start,
            lt: endExclusive,
          },
          status: {
            not: "VOID",
          },
        },
        select: {
          amount: true,
          method: true,
          status: true,
        },
      });

      const totalPaid = payments.reduce(
        (sum, p) => sum + toNumber(p.amount),
        0
      );

      const paymentMethodMap = new Map<
        string,
        { method: string; total: number; count: number }
      >();

      for (const p of payments) {
        const method = p.method || "Unknown";
        const existing = paymentMethodMap.get(method) ?? {
          method,
          total: 0,
          count: 0,
        };

        existing.total += toNumber(p.amount);
        existing.count += 1;

        paymentMethodMap.set(method, existing);
      }

      const paymentsByMethod = Array.from(paymentMethodMap.values()).sort(
        (a, b) => b.total - a.total
      );

      // =========================================================
      // 6) COST BASIS FOR PROVISIONAL COGS
      // Weighted average received cost per product using all GRNs
      // up to quarter end. This is stronger than only quarter GRNs.
      // =========================================================
      const costBasisLines = await tx.goodsReceiptItem.findMany({
        where: {
          grn: {
            date: {
              lt: endExclusive,
            },
          },
        },
        select: {
          productId: true,
          productDraftId: true,
          receivedQty: true,
          unitPrice: true,
          promotedProduct: {
            select: {
              productId: true,
              name: true,
              Department: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const weightedCostMap = new Map<
        string,
        {
          productId: string;
          productName: string;
          department: string | null;
          totalQty: number;
          totalValue: number;
          weightedAverageUnitCost: number;
        }
      >();

      for (const line of costBasisLines) {
        const qty = Number(line.receivedQty || 0);
        const unitPrice = toNumber(line.unitPrice);

        if (qty <= 0) continue;

        const resolvedProductId =
          line.promotedProduct?.productId ?? line.productDraftId;
        const productName =
          line.promotedProduct?.name ?? line.product?.name ?? "Unknown Product";
        const department = line.promotedProduct?.Department ?? "Unassigned";

        const existing = weightedCostMap.get(resolvedProductId) ?? {
          productId: resolvedProductId,
          productName,
          department,
          totalQty: 0,
          totalValue: 0,
          weightedAverageUnitCost: 0,
        };

        existing.totalQty += qty;
        existing.totalValue += qty * unitPrice;
        existing.weightedAverageUnitCost =
          existing.totalQty > 0 ? existing.totalValue / existing.totalQty : 0;

        weightedCostMap.set(resolvedProductId, existing);
      }

      // =========================================================
      // 7) USAGE / STOCK REQUEST ACTIVITY
      // This is your best current internal-consumption proxy
      // =========================================================
      const usageLines = await tx.stockRequestLine.findMany({
        where: {
          stockRequest: {
            submittedAt: {
              gte: start,
              lt: endExclusive,
            },
            status: {
              in: ["FULFILLED", "IN_REVIEW", "SUBMITTED"],
            },
          },
        },
        select: {
          productId: true,
          qtyOnHandAtRequest: true,
          requestedQty: true,
          grantedQty: true,
          outcome: true,
          product: {
            select: {
              productId: true,
              name: true,
              Department: true,
            },
          },
          stockRequest: {
            select: {
              requestedByLocation: true,
              status: true,
            },
          },
        },
      });

      let totalRequestedQty = 0;
      let totalGrantedQty = 0;
      let totalUnfulfilledQty = 0;

      const usageByProductMap = new Map<
        string,
        {
          productId: string;
          productName: string;
          department: string | null;
          totalQtyOnHandAtRequest: number;
          requestCount: number;
          totalRequestedQty: number;
          totalGrantedQty: number;
          totalUnfulfilledQty: number;
          estimatedUnitCost: number;
          estimatedCOGS: number;
        }
      >();

      const usageByLocationMap = new Map<
        string,
        {
          location: string;
          totalRequestedQty: number;
          totalGrantedQty: number;
          totalUnfulfilledQty: number;
          estimatedCOGS: number;
        }
      >();

      for (const line of usageLines) {
        const requestedQty = Number(line.requestedQty || 0);
        const grantedQty = Number(line.grantedQty || 0);
        const unfulfilledQty = Math.max(requestedQty - grantedQty, 0);

        totalRequestedQty += requestedQty;
        totalGrantedQty += grantedQty;
        totalUnfulfilledQty += unfulfilledQty;

        const productId = line.productId;
        const productName = line.product?.name ?? "Unknown Product";
        const department = line.product?.Department ?? "Unassigned";
        const location = line.stockRequest?.requestedByLocation ?? "other";

        const estimatedUnitCost =
          weightedCostMap.get(productId)?.weightedAverageUnitCost ?? 0;
        const estimatedCOGS = grantedQty * estimatedUnitCost;

        const existingProduct = usageByProductMap.get(productId) ?? {
          productId,
          productName,
          department,
          totalQtyOnHandAtRequest: 0,
          requestCount: 0,
          totalRequestedQty: 0,
          totalGrantedQty: 0,
          totalUnfulfilledQty: 0,
          estimatedUnitCost: 0,
          estimatedCOGS: 0,
        };

        existingProduct.totalQtyOnHandAtRequest += Number(
          line.qtyOnHandAtRequest || 0
        );
        existingProduct.requestCount += 1;
        existingProduct.totalRequestedQty += requestedQty;
        existingProduct.totalGrantedQty += grantedQty;
        existingProduct.totalUnfulfilledQty += unfulfilledQty;
        existingProduct.estimatedUnitCost = estimatedUnitCost;
        existingProduct.estimatedCOGS += estimatedCOGS;

        usageByProductMap.set(productId, existingProduct);

        const existingLocation = usageByLocationMap.get(location) ?? {
          location,
          totalRequestedQty: 0,
          totalGrantedQty: 0,
          totalUnfulfilledQty: 0,
          estimatedCOGS: 0,
        };

        existingLocation.totalRequestedQty += requestedQty;
        existingLocation.totalGrantedQty += grantedQty;
        existingLocation.totalUnfulfilledQty += unfulfilledQty;
        existingLocation.estimatedCOGS += estimatedCOGS;

        usageByLocationMap.set(location, existingLocation);
      }

      const fillRate =
        totalRequestedQty > 0 ? totalGrantedQty / totalRequestedQty : 0;

      const topIssuedItems = Array.from(usageByProductMap.values())
        .map((item) => ({
          productId: item.productId,
          productName: item.productName,
          department: item.department,
          totalRequestedQty: item.totalRequestedQty,
          totalGrantedQty: item.totalGrantedQty,
          totalUnfulfilledQty: item.totalUnfulfilledQty,
          avgQtyOnHandAtRequest:
            item.requestCount > 0
              ? item.totalQtyOnHandAtRequest / item.requestCount
              : 0,
          estimatedUnitCost: item.estimatedUnitCost,
          estimatedCOGS: item.estimatedCOGS,
        }))
        .sort((a, b) => b.estimatedCOGS - a.estimatedCOGS)
        .slice(0, 10);

      const usageByLocation = Array.from(usageByLocationMap.values()).sort(
        (a, b) => b.estimatedCOGS - a.estimatedCOGS
      );

      // =========================================================
      // 8) PROVISIONAL COGS & DERIVED METRICS
      // =========================================================
      const provisionalCOGS = Array.from(usageByProductMap.values()).reduce(
        (sum, item) => sum + item.estimatedCOGS,
        0
      );

      const estimatedGrossProfit = totalRevenue - provisionalCOGS;
      const estimatedGrossMargin =
        totalRevenue > 0 ? estimatedGrossProfit / totalRevenue : 0;

      const grossOperatingSurplus =
        totalRevenue - totalPaidExpenses - totalReceivedValue;

      const estimatedOperatingSurplusAfterExpenses =
        estimatedGrossProfit - totalPaidExpenses;

      const netCashOutflowKnown = totalPaidExpenses + totalPaid;

      const averageRevenuePerSale =
        salesEntryCount > 0 ? totalRevenue / salesEntryCount : 0;

      const supplierPaymentCoverageRatio =
        totalInvoiced > 0 ? totalPaid / totalInvoiced : 0;

      const cashMixPct = totalRevenue > 0 ? totalCash / totalRevenue : 0;
      const creditMixPct = totalRevenue > 0 ? totalCredit / totalRevenue : 0;
      const debitMixPct = totalRevenue > 0 ? totalDebit / totalRevenue : 0;
      const chequeMixPct = totalRevenue > 0 ? totalCheque / totalRevenue : 0;

      const topExpenseShare =
        totalPaidExpenses > 0 && expensesByCategory.length > 0
          ? expensesByCategory[0].total / totalPaidExpenses
          : 0;

      // =========================================================
      // 9) LIMITATIONS
      // =========================================================
      const limitations = [
        "Provisional COGS is estimated using fulfilled stock requests valued at weighted average GRN unit cost up to quarter end.",
        "Fulfilled stock requests may not capture all inventory usage, wastage, expiry, internal adjustments, transfers, or unlogged consumption.",
        "Received inventory value is a purchasing measure and should not be treated as true accounting COGS unless inventory movement and closing stock are fully reconciled.",
        "Operating expenses reported here include only paid expenses recorded in the Expenses table for the selected period.",
        "Gross margin and operating surplus interpretations should be treated cautiously if payroll, rent, utilities, depreciation, tax, or other overheads are incomplete or recorded elsewhere.",
        "Current schema does not provide a full general ledger, opening inventory valuation, closing inventory valuation snapshot, or receivables aging needed for full financial-statement-grade analysis.",
      ];

      return {
        quarterName,
        period: {
          start,
          endExclusive,
        },
        sales: {
          totalRevenue,
          totalCash,
          totalCredit,
          totalDebit,
          totalCheque,
          entryCount: salesEntryCount,
          paymentMix: {
            cashPct: cashMixPct,
            creditPct: creditMixPct,
            debitPct: debitMixPct,
            chequePct: chequeMixPct,
          },
        },
        expenses: {
          totalPaidExpenses,
          byCategory: expensesByCategory,
          concentration: {
            topCategoryShare: topExpenseShare,
          },
        },
        purchasing: {
          totalReceivedQty,
          totalReceivedValue,
          topItems,
          byDepartment: purchasingByDepartment,
        },
        payables: {
          totalInvoiced,
          totalOutstanding,
          totalPaid,
          paymentsByMethod,
        },
        usage: {
          totalRequestedQty,
          totalGrantedQty,
          totalUnfulfilledQty,
          fillRate,
          topIssuedItems,
          byLocation: usageByLocation,
        },
        costing: {
          method:
            "Weighted average GRN unit cost applied to granted stock requests",
          provisionalCOGS,
          estimatedGrossProfit,
          estimatedGrossMargin,
        },
        derivedMetrics: {
          averageRevenuePerSale,
          supplierPaymentCoverageRatio,
          estimatedOperatingSurplusAfterExpenses,
          grossOperatingSurplusUsingPurchasesProxy: grossOperatingSurplus,
          netCashOutflowKnown,
        },
        summary: {
          grossOperatingSurplus,
          netCashOutflowKnown,
        },
        limitations,
      };
    });

    return result;
  } catch (error) {
    console.error("QuarterlyReport error:", error);
    throw error;
  }
};

export const getQuarterlyReport = async (req: Request, res: Response) => {
  try {
    const { quarter, year } = req.body;
    
        if (!quarter || !year) {
          return res.status(400).json({
            message: "quarter and year are required",
          });
        }
    
        const quarterNum = Number(quarter);
        const yearNum = Number(year);
    
        if (![1, 2, 3, 4].includes(quarterNum) || Number.isNaN(yearNum)) {
          return res.status(400).json({
            message: "Invalid quarter or year",
          });
        }
    
        const data = await QuarterlyReport(quarterNum, yearNum);    
    // Optional: If a query param ?ai=true is passed, send to OpenAI here
    // const aiSummary = await sendToOpenAI(data); 

    return res.status(200).json(data);
  } catch (error) {
    console.error("QuarterlyReport error:", error);
    return res.status(500).json({ message: "Failed to generate report" });
  }
}