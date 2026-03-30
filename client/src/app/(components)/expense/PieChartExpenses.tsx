import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { DollarSign, AlertCircle } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface Expense {
  expenseId: string;
  category: string;
  group: string;
  amount: number;
  date: string;
  status: string;
  description?: string;
  title?: string;
}

interface ExpenseGroupDonutCardProps {
  expenses: Expense[];
}

const ExpenseGroupDonutCard: React.FC<ExpenseGroupDonutCardProps> = ({
  expenses,
}) => {
  const groupData = useMemo(() => {
    const groups = expenses.reduce((acc, expense) => {
      const group = expense.group || "Other";
      acc[group] = (acc[group] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const total = groupData.reduce((sum, item) => sum + item.value, 0);
  const topGroup = [...groupData].sort((a, b) => b.value - a.value)[0];

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-primary/15 bg-primary/10 p-2.5">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-foreground">
              Expense by Group
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">This Month</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6 flex flex-1 items-center justify-center">
        <div className="relative w-full max-w-[280px]">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  boxShadow: "0 10px 20px rgba(0, 0, 0, 0.18)",
                  padding: "12px",
                  color: "hsl(var(--popover-foreground))",
                }}
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />

              <Pie
                data={groupData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {groupData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center Total */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xs font-medium text-muted-foreground">
                Total Expense
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                $
                {total.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend with Stats */}
      <div className="space-y-3 border-t border-border/60 pt-4">
        {groupData.map((item, idx) => {
          const percentage = total > 0 ? ((item.value / total) * 100).toFixed(0) : "0";

          return (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg p-2.5 transition-colors hover:bg-muted/30"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div
                  className="h-3 w-3 flex-shrink-0 rounded-full shadow-sm"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="truncate text-sm font-semibold text-foreground">
                  {item.name}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-xs font-medium text-muted-foreground">
                  {percentage}%
                </span>
                <span className="min-w-[90px] text-right text-sm font-bold text-foreground">
                  ${item.value.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Insight */}
      {topGroup && total > 0 && (
        <div className="mt-4 rounded-xl border border-primary/15 bg-primary/10 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground">
                <span className="font-bold">{topGroup.name}</span> accounts for{" "}
                {((topGroup.value / total) * 100).toFixed(0)}% of total expenses
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseGroupDonutCard;