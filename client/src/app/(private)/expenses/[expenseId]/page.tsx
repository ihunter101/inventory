"use client";

import { useParams } from "next/navigation";
import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import { useGetExpenseByIdQuery } from "@/app/state/api";

export default function ViewExpensePage() {
  const params = useParams();
  const expenseId = params.expenseId as string;

  const {
    data: expense,
    isLoading,
    isError,
    error,
  } = useGetExpenseByIdQuery(expenseId, {
    skip: !expenseId,
  });

  if (isLoading) {
    return (
      <main className="p-6">
        <Typography>Loading expense...</Typography>
      </main>
    );
  }

  if (isError || !expense) {
    return (
      <main className="p-6">
        <Typography color="error">
          Failed to load expense: {JSON.stringify(error)}
        </Typography>
      </main>
    );
  }

  const document = expense.document?.[0];

  return (
    <main className="p-6 space-y-6">
      <Box>
        <Typography variant="h4" fontWeight={700}>
          Expense Details
        </Typography>

        <Typography className="text-muted-foreground">
          Review the expense record and its linked document.
        </Typography>
      </Box>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <CardContent sx={{ p: 0 }}>
            {document?.fileUrl ? (
              <iframe
                src={document.fileUrl}
                className="h-[80vh] w-full"
                title={document.fileName || "Expense document"}
              />
            ) : (
              <Box sx={{ p: 3 }}>
                <Typography className="text-muted-foreground">
                  No PDF/document linked to this expense.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <CardContent className="space-y-4">
            <Box>
              <Typography className="text-sm text-muted-foreground">
                Company
              </Typography>
              <Typography fontWeight={700}>
                {expense.companyName || expense.vendorName || "Unknown company"}
              </Typography>
            </Box>

            <Box>
              <Typography className="text-sm text-muted-foreground">
                Description
              </Typography>
              <Typography>
                {expense.description || "No description provided"}
              </Typography>
            </Box>

            <Box>
              <Typography className="text-sm text-muted-foreground">
                Amount
              </Typography>
              <Typography variant="h5" fontWeight={800}>
                {expense.currency || "XCD"} {Number(expense.amount).toFixed(2)}
              </Typography>
            </Box>

            <Box>
              <Typography className="text-sm text-muted-foreground">
                Status
              </Typography>
              <Chip label={expense.status} size="small" />
            </Box>

            <Box>
              <Typography className="text-sm text-muted-foreground">
                Category
              </Typography>
              <Typography>{expense.category}</Typography>
            </Box>

            <Box>
              <Typography className="text-sm text-muted-foreground">
                Group
              </Typography>
              <Typography>{expense.group}</Typography>
            </Box>

            <Box>
              <Typography className="text-sm text-muted-foreground">
                Invoice Number
              </Typography>
              <Typography>{expense.invoiceNumber || "N/A"}</Typography>
            </Box>

            <Box>
              <Typography className="text-sm text-muted-foreground">
                Expense Date
              </Typography>
              <Typography>
                {expense.expenseDate
                  ? new Date(expense.expenseDate).toLocaleDateString()
                  : "N/A"}
              </Typography>
            </Box>

            <Box>
              <Typography className="text-sm text-muted-foreground">
                Created
              </Typography>
              <Typography>
                {new Date(expense.createdAt).toLocaleString()}
              </Typography>
            </Box>

            {expense.notes && (
              <Box>
                <Typography className="text-sm text-muted-foreground">
                  Notes
                </Typography>
                <Typography>{expense.notes}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}