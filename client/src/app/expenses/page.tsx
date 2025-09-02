
"use client";

import React from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Box,
} from "@mui/material";
import { useGetExpensesQuery } from "../state/api";
import PieChartExpenses from "../(components)/expense/PieChartExpenses";
import BarChartCategoryAnalysis from "../(components)/expense/BarChartCategoryAnalysis";
import ExpenseTrendChart from "../(components)/expense/LineChartExpenseTrend";
import AddExpenseDialog from "../(components)/expense/AddExpenseDialog";
import ExpenseKPICards from "../(components)/expense/ExpenseKPICard";
import RecentTransactionsTable from "../(components)/expense/RecentTransactionTable";

const ExpenseDashboard = () => {
  const { data: expenses = [], isLoading, isError, refetch } =
    useGetExpensesQuery();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container justifyContent="space-between" alignItems="center">
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Expense Dashboard
        </Typography>
        <AddExpenseDialog />
      </Grid>

      <ExpenseKPICards expenses={expenses} />

  <Grid container spacing={2}>
  <Grid item xs={12} md={12} lg={12}>
    <ExpenseTrendChart expenses={expenses} />
  </Grid>
  <Grid item xs={12} md={12} lg={12}>
    <PieChartExpenses expenses={expenses} />
  </Grid>
  <Grid item xs={12} md={12} lg={12}>
    <BarChartCategoryAnalysis expenses={expenses} />
  </Grid>
  </Grid>



      <Card sx={{ mt: 4 }}>
        <CardHeader title="Recent Transactions" />
        <CardContent>
          <RecentTransactionsTable expenses={expenses}  />
        </CardContent>
      </Card>
    </Container>
  );
};

export default ExpenseDashboard;




{/*

"use client";

import * as React from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Box,
  Chip,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { useGetExpensesQuery } from "../state/api";
import AddExpenseButton from "./ExpenseButton";
import {
  Activity,
  DollarSign,
  TrendingUp,
  CalendarDays,
} from "lucide-react";

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#84CC16",
  "#F97316",
];

const ExpenseDashboard = () => {
  const { data: expenses = [], isLoading, isError } = useGetExpensesQuery();

  const totalExpenses = React.useMemo(
    () => expenses.reduce((sum: number, e: any) => sum + e.amount, 0),
    [expenses]
  );

  const categoryTotals = React.useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e: any) => {
      const cat = e.category ?? "Other";
      map[cat] = (map[cat] ?? 0) + e.amount;
    });

    return Object.entries(map).map(([name, value], i) => ({
      name,
      value,
      fill: COLORS[i % COLORS.length],
    }));
  }, [expenses]);

  const categoryBarData = categoryTotals.map(({ name, value }) => ({
    category: name,
    amount: value,
  }));

  const trendData = [...expenses]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((e: any) => ({
      date: new Date(e.date).toLocaleDateString(),
      amount: e.amount,
    }));

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" fontWeight={700}>
          Expenses
        </Typography>
        <AddExpenseButton />
      </Box>

      <Grid container spacing={2} mb={3}>
        {[
          {
            label: "Total Expenses",
            value: `$${totalExpenses.toLocaleString()}`,
            icon: <DollarSign className="text-blue-600" />,
          },
          {
            label: "Categories",
            value: categoryTotals.length,
            icon: <Activity className="text-green-500" />,
          },
          {
            label: "Transactions",
            value: expenses.length,
            icon: <TrendingUp className="text-orange-500" />,
          },
          {
            label: "Latest",
            value: expenses[expenses.length - 1]?.category ?? "—",
            icon: <CalendarDays className="text-purple-600" />,
          },
        ].map((item, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box>{item.icon}</Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    {item.label}
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {item.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Expenses by Category" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryTotals}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label
                  >
                    {categoryTotals.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend />
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Category Analysis" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryBarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="amount" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 4 }}>
        <CardHeader title="Expense Trend" />
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <RechartsTooltip />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#colorBlue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card sx={{ mt: 4 }}>
        <CardHeader title="Recent Transactions" />
        <CardContent sx={{ px: 0 }}>
          <Box component="table" width="100%" sx={{ borderSpacing: 0 }}>
            <thead>
              <tr>
                {["Date", "Category", "Amount", "Status"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      fontSize: "0.8rem",
                      padding: "12px 16px",
                      color: "#6b7280",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.slice(-10).reverse().map((e: any) => (
                <tr
                  key={e.expenseId}
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <td style={{ padding: "10px 16px" }}>
                    {new Date(e.date).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "10px 16px" }}>{e.category}</td>
                  <td style={{ padding: "10px 16px" }}>
                    ${e.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <Chip
                      label={e.status}
                      size="small"
                      color={e.status === "approved" ? "success" : "warning"}
                      variant="outlined"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default ExpenseDashboard;
*/}


// ExpenseDashboard.tsx