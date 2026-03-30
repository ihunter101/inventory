"use client";

import React, { useMemo, useState } from "react";
import { Container, Typography, Grid, Card, CardContent, CardHeader, Box } from "@mui/material";
import { useGetExpensesQuery } from "../../state/api";

import ExpenseTrendChart from "../../(components)/expense/LineChartExpenseTrend";
import AddExpenseDialog from "../../(components)/expense/AddExpenseDialog";
import ExpenseKPICards from "../../(components)/expense/ExpenseKPICard";
import RecentTransactionsTable from "../../(components)/expense/RecentTransactionTable";
import BarChartCategoryAnalysis from "../../(components)/expense/BarChartCategoryAnalysis";
import ExpenseGroupDonutCard from "@/app/(components)/expense/PieChartExpenses";

type Range = "1w" | "1m" | "6m" | "1y" | "all";

//  Pure function — no hooks, lives outside component safely
const getDateRange = (range: Range): { from: string; end: string } => {
  const now = new Date();
  const from = new Date(now);

  switch (range) {
    case "1w": from.setDate(now.getDate() - 7); break;
    case "1m": from.setMonth(now.getMonth() - 1); break;
    case "6m": from.setMonth(now.getMonth() - 6); break;
    case "1y": from.setFullYear(now.getFullYear() - 1); break;
    case "all":
      from.setFullYear(2000, 0, 1); // distant past — fetch everything
      break;
  }

  return { from: from.toISOString(), end: now.toISOString() };
};

const ExpenseDashboard = () => {
  //  useState inside the component
  const [range, setRange] = useState<Range>("1m");

  //  Derived from range — no useMemo needed, it's just a function call
  const { from, end } = getDateRange(range);

  //  Backend does the filtering — no client-side filterByRange needed
  const { data: expenses = [], isLoading, isError } = useGetExpensesQuery({ from, end });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* HEADER */}
      <Box
        className="mb-6 rounded-2xl border border-border/60 bg-card shadow-sm"
        sx={{ p: { xs: 2, md: 3 } }}
      >
        <Grid container justifyContent="space-between" alignItems="center" spacing={2}>
          <Grid item xs={12} md="auto">
            <Typography
              variant="h4"
              fontWeight={700}
              className="text-foreground"
              sx={{ letterSpacing: "-0.02em" }}
            >
              Expense Dashboard
            </Typography>
            <Typography
              className="text-muted-foreground"
              sx={{ mt: 0.75, fontSize: "0.95rem" }}
            >
              Track expense trends, categories, and transaction activity
            </Typography>
          </Grid>

          <Grid item xs={12} md="auto">
            <Box sx={{ display: "flex", alignItems: { xs: "stretch", sm: "center" }, gap: 1.5, flexWrap: "wrap" }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                {(["1w", "1m", "6m", "1y", "all"] as Range[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      range === r
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/60 bg-background text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    {r === "all" ? "All" : r}
                  </button>
                ))}
              </Box>
              <AddExpenseDialog />
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* ✅ All children receive server-filtered expenses — no extra filtering */}
      <ExpenseKPICards expenses={expenses} />

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <ExpenseTrendChart expenses={expenses} />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 2 }} alignItems="stretch">
        <Grid item xs={12} md={4} lg={4} sx={{ display: "flex" }}>
          <Box sx={{ flex: 1 }}>
            <ExpenseGroupDonutCard expenses={expenses} />
          </Box>
        </Grid>
        <Grid item xs={12} md={8} lg={8} sx={{ display: "flex" }}>
          <Box sx={{ flex: 1, minHeight: 360 }}>
            <BarChartCategoryAnalysis expenses={expenses} />
          </Box>
        </Grid>
      </Grid>

      <Card
        className="mt-6 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
        sx={{ mt: 4 }}
      >
        <CardHeader
          title={
            <Typography className="text-foreground" sx={{ fontWeight: 700 }}>
              Recent Transactions
            </Typography>
          }
          sx={{
            borderBottom: "1px solid hsl(var(--border) / 0.6)",
            backgroundColor: "hsl(var(--muted) / 0.2)",
          }}
        />
        <CardContent sx={{ p: 0 }}>
          <RecentTransactionsTable expenses={expenses} />
        </CardContent>
      </Card>
    </Container>
  );
};

export default ExpenseDashboard;