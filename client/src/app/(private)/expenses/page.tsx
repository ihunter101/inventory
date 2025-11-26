"use client";

import React, { useMemo, useState } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Box,
} from "@mui/material";
import { useGetExpensesQuery } from "../../state/api";

import ExpenseTrendChart from "../../(components)/expense/LineChartExpenseTrend";
import AddExpenseDialog from "../../(components)/expense/AddExpenseDialog";
import ExpenseKPICards from "../../(components)/expense/ExpenseKPICard";
import RecentTransactionsTable from "../../(components)/expense/RecentTransactionTable";
import BarChartCategoryAnalysis from "../../(components)/expense/BarChartCategoryAnalysis";

// 👉 make sure this file actually exists with the group donut code we wrote
import ExpenseGroupDonutCard from "@/app/(components)/expense/PieChartExpenses";

type Range = "1w" | "1m" | "6m" | "1y" | "all";

const filterByRange = (expenses: any[], range: Range) => {
  if (range === "all") return expenses;

  const now = new Date();
  const from = new Date(now);

  if (range === "1w") from.setDate(now.getDate() - 7);
  if (range === "1m") from.setMonth(now.getMonth() - 1);
  if (range === "6m") from.setMonth(now.getMonth() - 6);
  if (range === "1y") from.setFullYear(now.getFullYear() - 1);

  return expenses.filter((e) => new Date(e.date) >= from);
};

const ExpenseDashboard = () => {
  const [range, setRange] = useState<Range>("1m");

  const { data: expenses = [], isLoading, isError } = useGetExpensesQuery();
  console.log("EXPENSES FROM API:", expenses, { isLoading, isError });

  const filteredExpenses = useMemo(
    () => filterByRange(expenses, range),
    [expenses, range]
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* HEADER + RANGE FILTER + ADD BUTTON */}
      <Grid
        container
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h4" fontWeight={700}>
          Expense Dashboard
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* range pills */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {(["1w", "1m", "6m", "1y", "all"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 text-xs rounded-full border ${
                  range === r
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                {r === "1w"
                  ? "1w"
                  : r === "1m"
                  ? "1m"
                  : r === "6m"
                  ? "6m"
                  : r === "1y"
                  ? "1y"
                  : "All"}
              </button>
            ))}
          </Box>

          {/* Add Expense button */}
          <AddExpenseDialog />
        </Box>
      </Grid>

      {/* KPI CARDS */}
      <ExpenseKPICards expenses={filteredExpenses} />

      {/* TREND FULL WIDTH */}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <ExpenseTrendChart expenses={filteredExpenses} />
        </Grid>
      </Grid>

      {/* DONUT (GROUP) + BAR (CATEGORY) – SAME HEIGHT ROW */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4} lg={4}>
          <Box sx={{ height: "100%" }}>
            <ExpenseGroupDonutCard expenses={filteredExpenses} />
          </Box>
        </Grid>

        <Grid item xs={12} md={8} lg={8}>
          <Box sx={{ height: "100%" }}>
            <BarChartCategoryAnalysis expenses={filteredExpenses} />
          </Box>
        </Grid>
      </Grid>

      {/* RECENT TRANSACTIONS TABLE */}
      <Card sx={{ mt: 4 }}>
        <CardHeader title="Recent Transactions" />
        <CardContent>
          <RecentTransactionsTable expenses={filteredExpenses} />
        </CardContent>
      </Card>
    </Container>
  );
};

export default ExpenseDashboard;
