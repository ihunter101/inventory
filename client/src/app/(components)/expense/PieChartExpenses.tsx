import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DollarSign, AlertCircle } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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

const ExpenseGroupDonutCard: React.FC<ExpenseGroupDonutCardProps> = ({ expenses }) => {
  const groupData = useMemo(() => {
    const groups = expenses.reduce((acc, expense) => {
      const group = expense.group || 'Other';
      acc[group] = (acc[group] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const total = groupData.reduce((sum, item) => sum + item.value, 0);
  const topGroup = [...groupData].sort((a, b) => b.value - a.value)[0];

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-xl">
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Expense by Group</h3>
            <p className="text-xs text-gray-500 mt-0.5">This Month</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 flex items-center justify-center mb-6">
        <div className="relative w-full max-w-[280px]">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  padding: '12px',
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
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center Total */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-xs text-gray-500 font-medium">Total Expense</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend with Stats */}
      <div className="space-y-3 border-t border-gray-100 pt-4">
        {groupData.map((item, idx) => {
          const percentage = ((item.value / total) * 100).toFixed(0);
          return (
            <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-sm font-semibold text-gray-700 truncate">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                  {percentage}%
                </span>
                <span className="text-sm font-bold text-gray-900 min-w-[90px] text-right">
                  ${item.value.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Insight */}
      {topGroup && (
        <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-900 font-medium">
                <span className="font-bold">{topGroup.name}</span> accounts for{' '}
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