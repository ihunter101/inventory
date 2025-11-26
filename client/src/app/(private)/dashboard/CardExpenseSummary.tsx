import {
  ExpenseByCategorySummary,
  useGetDashboardMetricsQuery,
} from "@/app/state/api";
import { TrendingUp } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

type ExpenseSums = {
  [category: string]: number;
};

const colors = ["#00C49F", "#0088FE", "#FFBB28"];

const CardExpenseSummary = () => {
    
  const { data: dashboardMetrics, isLoading, error } = useGetDashboardMetricsQuery();
    

  const expenseSummary = dashboardMetrics?.expenseSummary[0];
  console.log("Expense Summary:", expenseSummary);

  const expenseByCategorySummary =
    dashboardMetrics?.expenseByCategorySummary || [];
  console.log("Expense By Category Summary:", expenseByCategorySummary);

  const expenseSums = expenseByCategorySummary.reduce(
    (acc: ExpenseSums, item: ExpenseByCategorySummary) => {
      const category = item.category + " Expenses";
      // Use parseFloat instead of parseInt to preserve decimals
      const amount = parseFloat(item.amount) || 0;
      console.log(`Processing category: ${category}, amount: ${amount}`);
      if (!acc[category]) acc[category] = 0;
      acc[category] += amount;
      return acc;
    },
    {}
  );

  console.log("Expense Sums:", expenseSums);

  const expenseCategories = Object.entries(expenseSums).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  console.log("Expense Categories:", expenseCategories);

  const totalExpenses = expenseCategories.reduce(
    (acc, category: { value: number }) => acc + category.value,
    0
  );
  const formattedTotalExpenses = totalExpenses.toFixed(2);

  console.log("Total Expenses:", totalExpenses);
  console.log("Formatted Total Expenses:", formattedTotalExpenses);

  return (
    <div className="row-span-3 bg-white shadow-md rounded-2xl flex flex-col justify-between">
      {isLoading ? (
        <div className="m-5">Loading...</div>
      ) : error ? (
        <div className="m-5 text-red-500">
          Error loading data: {JSON.stringify(error)}
        </div>
      ) : (
        <>
          {/* HEADER */}
          <div>
            <h2 className="text-lg font-semibold mb-2 px-7 pt-5">
              Expense Summary
            </h2>
            <hr />
          </div>
          {/* BODY */}
          <div className="xl:flex justify-between pr-7">
            {/* CHART */}
            <div className="relative basis-3/5">
              {expenseCategories.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={expenseCategories}
                        innerRadius={50}
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                      >
                        {expenseCategories.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={colors[index % colors.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center basis-2/5">
                    <span className="font-bold text-xl">
                      ${formattedTotalExpenses}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[140px] text-gray-500">
                  No expense data available
                </div>
              )}
            </div>
            {/* LABELS */}
            <ul className="flex flex-col justify-around items-center xl:items-start py-5 gap-3">
              {expenseCategories.length > 0 ? (
                expenseCategories.map((entry, index) => (
                  <li
                    key={`legend-${index}`}
                    className="flex items-center text-xs"
                  >
                    <span
                      className="mr-2 w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    ></span>
                    {entry.name}: ${entry.value.toFixed(2)}
                  </li>
                ))
              ) : (
                <li className="text-gray-500 text-xs">No categories available</li>
              )}
            </ul>
          </div>
          {/* FOOTER */}
          <div>
            <hr />
            {expenseSummary ? (
              <div className="mt-3 flex justify-between items-center px-7 mb-4">
                <div className="pt-2">
                  <p className="text-sm">
                    Average:{" "}
                    <span className="font-semibold">
                      ${expenseSummary.totalExpenses.toFixed(2)}
                    </span>
                  </p>
                </div>
                <span className="flex items-center mt-2">
                  <TrendingUp className="mr-2 text-green-500" />
                  30%
                </span>
              </div>
            ) : (
              <div className="mt-3 px-7 mb-4 text-gray-500 text-sm">
                No summary data available
              </div>
            )}
          </div>
          {/* DEBUG INFO - Remove this in production */}
          <div className="mt-2 px-7 pb-4 text-xs text-gray-400 border-t pt-2">
            <p>Debug: Categories count: {expenseCategories.length}</p>
            <p>Debug: Has summary: {expenseSummary ? 'Yes' : 'No'}</p>
            <p>Debug: API Error: {error ? 'Yes' : 'No'}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default CardExpenseSummary;