"use client";

import { Expense } from "@/app/state/api";
import { formatCurrency, formatDate } from "./chequeDraftUtils";

type Props = {
  expenses: Expense[];
};

export default function ChequeDraftExpenseTable({ expenses }: Props) {
  return (
    <div className="bg-muted/20 px-6 pb-5">
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
        <table className="min-w-full divide-y divide-border/60">
          <thead className="bg-muted/30">
            <tr className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Invoice</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {expenses.map((expense) => (
              <tr
                key={expense.expenseId}
                className="text-sm transition-colors hover:bg-muted/30"
              >
                <td className="min-w-[240px] px-4 py-3 text-foreground">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {expense.description || "No description"}
                    </span>

                    {expense.notes && (
                      <span className="line-clamp-1 text-xs text-muted-foreground">
                        {expense.notes}
                      </span>
                    )}
                  </div>
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {expense.invoiceNumber || "—"}
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {expense.category || "Uncategorized"}
                </td>

                <td className="whitespace-nowrap px-4 py-3">
                  <span className="rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs font-semibold text-foreground">
                    {expense.status}
                  </span>
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {formatDate(expense.expenseDate || expense.createdAt)}
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-foreground">
                  {formatCurrency(
                    Number(expense.amount || 0),
                    expense.currency || "XCD"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}