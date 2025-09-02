"use client";

import { Filter, MoreHorizontal } from "lucide-react";
import { Expense } from "@/app/state/api"; // Adjust the path if needed

type Props = {
  expenses: Expense[];
};

// Example categories and colors for dot icons
const categories = [
  "Utilities",
  "Travel",
  "Professional Services",
  "Marketing",
  "Salaries",
  "Office Expenses",
];

const colors = [
  "#0ea5e9", // blue
  "#8b5cf6", // purple
  "#facc15", // yellow
  "#ef4444", // red
  "#10b981", // green
  "#6366f1", // indigo
];

// Helper to get badge color class based on status
function getStatusColor(status: string = "") {
  switch (status.toLowerCase()) {
    case "approved":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Helper to format currency
function formatCurrency(amount: number) {
  return `$${amount.toLocaleString()}`;
}

export const RecentTransactionsTable = ({ expenses }: Props) => {
  return (
    <div className="bg-white rounded-lg shadow border border-slate-200">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Recent Transactions</h3>
          <div className="flex items-center space-x-2">
            <button className="inline-flex items-center px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded-full hover:bg-slate-200">
              <Filter className="h-3 w-3 mr-1" />
              Filter
            </button>
            <button className="p-1 text-slate-400 hover:text-slate-600">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {expenses
              .slice(-10)
              .reverse()
              .map((expense) => (
                <tr key={expense.expenseId} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {new Date(expense.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className="w-2 h-2 rounded-full mr-3"
                        style={{
                          backgroundColor:
                            colors[categories.indexOf(expense.category)] || colors[0],
                        }}
                      ></div>
                      <span className="text-sm font-medium text-slate-900">
                        {expense.category}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                    {expense.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        expense.status
                      )}`}
                    >
                      {expense.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-900">
                    {formatCurrency(expense.amount)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentTransactionsTable;
