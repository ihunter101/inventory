"use client";

import {
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  DollarSign,
  Eye,
  TrendingUp,
} from "lucide-react";
import { Expense } from "@/app/state/api";

type Props = {
  expenses: Expense[];
};

const formatCurrency = (amount: number) =>
  `$${amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

const ExpenseKPICards = ({ expenses }: Props) => {
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalTransactions = expenses.length;

  const monthlyGroups: Record<string, number> = {};
  const pendingExpenses = expenses
    .filter((e) => e.status === "PENDING")
    .reduce((sum, e) => sum + e.amount, 0);

  expenses.forEach((e) => {
    const date = new Date(e.createdAt);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    monthlyGroups[key] = (monthlyGroups[key] ?? 0) + e.amount;
  });

  const months = Object.values(monthlyGroups).length || 1;
  const avgMonthlyExpense =
    Object.values(monthlyGroups).reduce((sum, val) => sum + val, 0) / months;

  const monthKeys = Object.keys(monthlyGroups).sort();
  const lastMonth = monthKeys[monthKeys.length - 1];
  const prevMonth = monthKeys[monthKeys.length - 2];

  const lastMonthTotal = monthlyGroups[lastMonth] || 0;
  const prevMonthTotal = monthlyGroups[prevMonth] || 0;

  const growthRate =
    prevMonthTotal > 0
      ? ((lastMonthTotal - prevMonthTotal) / prevMonthTotal) * 100
      : 0;

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Expenses */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex items-center">
          <div className="rounded-xl border border-primary/15 bg-primary/10 p-3">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>

          <div className="ml-4 w-full">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">
                Total Expenses
              </p>

              <div
                className={`flex items-center ${
                  growthRate >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {growthRate >= 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span className="ml-1 text-xs">
                  {Math.abs(growthRate).toFixed(1)}%
                </span>
              </div>
            </div>

            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
        </div>
      </div>

      {/* Avg Monthly Expense */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex items-center">
          <div className="rounded-xl border border-emerald-200/40 bg-emerald-500/10 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/30">
            <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>

          <div className="ml-4">
            <p className="text-sm font-medium text-muted-foreground">
              Monthly Average
            </p>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(avgMonthlyExpense)}
            </p>
          </div>
        </div>
      </div>

      {/* Pending Approval */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex items-center">
          <div className="rounded-xl border border-amber-200/40 bg-amber-500/10 p-3 dark:border-amber-900/40 dark:bg-amber-950/30">
            <Calendar className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>

          <div className="ml-4">
            <p className="text-sm font-medium text-muted-foreground">
              Pending Approval
            </p>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(pendingExpenses)}
            </p>
          </div>
        </div>
      </div>

      {/* Total Transactions */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex items-center">
          <div className="rounded-xl border border-violet-200/40 bg-violet-500/10 p-3 dark:border-violet-900/40 dark:bg-violet-950/30">
            <Eye className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>

          <div className="ml-4">
            <p className="text-sm font-medium text-muted-foreground">
              Total Transactions
            </p>
            <p className="text-2xl font-bold text-foreground">
              {totalTransactions}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseKPICards;