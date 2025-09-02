"use client";

import { ArrowUpRight, ArrowDownRight, Calendar, DollarSign, Eye, TrendingUp } from "lucide-react";
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
    .filter((e) => e.status === "pending")
    .reduce((sum, e) => sum + e.amount, 0);

  expenses.forEach((e) => {
    const date = new Date(e.date);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`; // e.g., 2025-9
    monthlyGroups[key] = (monthlyGroups[key] ?? 0) + e.amount;
  });

  const months = Object.values(monthlyGroups).length || 1;
  const avgMonthlyExpense =
    Object.values(monthlyGroups).reduce((sum, val) => sum + val, 0) / months;

  // Optional: calculate growth rate based on the last 2 months (simplified)
  const monthKeys = Object.keys(monthlyGroups).sort(); // asc
  const lastMonth = monthKeys[monthKeys.length - 1];
  const prevMonth = monthKeys[monthKeys.length - 2];

  const lastMonthTotal = monthlyGroups[lastMonth] || 0;
  const prevMonthTotal = monthlyGroups[prevMonth] || 0;

  const growthRate =
    prevMonthTotal > 0
      ? ((lastMonthTotal - prevMonthTotal) / prevMonthTotal) * 100
      : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Expenses */}
      <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
        <div className="flex items-center">
          <div className="bg-blue-50 p-3 rounded-lg">
            <DollarSign className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4 w-full">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">Total Expenses</p>
              <div className={`flex items-center ${growthRate >= 0 ? "text-green-600" : "text-red-600"}`}>
                {growthRate >= 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span className="text-xs ml-1">{Math.abs(growthRate).toFixed(1)}%</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
        </div>
      </div>

      {/* Avg Monthly Expense */}
      <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
        <div className="flex items-center">
          <div className="bg-green-50 p-3 rounded-lg">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-slate-600">Monthly Average</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(avgMonthlyExpense)}
            </p>
          </div>
        </div>
      </div>

      {/* Pending Approval */}
      <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
        <div className="flex items-center">
          <div className="bg-yellow-50 p-3 rounded-lg">
            <Calendar className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-slate-600">Pending Approval</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(pendingExpenses)}
            </p>
          </div>
        </div>
      </div>

      {/* Total Transactions */}
      <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
        <div className="flex items-center">
          <div className="bg-purple-50 p-3 rounded-lg">
            <Eye className="h-6 w-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-slate-600">Total Transactions</p>
            <p className="text-2xl font-bold text-slate-900">{totalTransactions}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseKPICards;
