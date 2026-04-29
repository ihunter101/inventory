"use client";

import * as React from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";
import { useGetClientDashboardQuery } from "@/app/state/api";

function money(value: number | string | null | undefined) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

export default function ClientDashboardPage() {
  const { data, isLoading, isError } = useGetClientDashboardQuery();

  if (isLoading) {
    return <Typography>Loading client dashboard...</Typography>;
  }

  if (isError || !data) {
    return (
      <Typography color="error">
        Failed to load client dashboard.
      </Typography>
    );
  }

  const summaryCards = [
    {
      label: "Total Billed",
      value: money(data.summary.totalBilled),
    },
    {
      label: "Total Paid",
      value: money(data.summary.totalPaid),
    },
    {
      label: "Outstanding",
      value: money(data.summary.totalOutstanding),
    },
    {
      label: "Open Invoices",
      value: data.summary.openInvoices,
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>
          Welcome, {data.organization.name}
        </Typography>

        <Typography color="text.secondary">
          Account linked to {data.customer.companyName || data.customer.name}
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {summaryCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Card sx={{ borderRadius: 4, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {card.label}
                </Typography>

                <Typography variant="h5" fontWeight={800}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ borderRadius: 4, boxShadow: 2 }}>
        <CardContent>
          <Box
            sx={{
              mb: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={800}>
                Recent Invoices
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Latest invoices from your account.
              </Typography>
            </Box>

            <Button component={Link} href="/client/invoices">
              View All
            </Button>
          </Box>

          {data.recentInvoices.length === 0 ? (
            <Typography color="text.secondary">No invoices found.</Typography>
          ) : (
            data.recentInvoices.map((invoice) => (
              <Box
                key={invoice.invoiceId}
                sx={{
                  py: 1.5,
                  borderTop: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Box>
                  <Typography fontWeight={700}>
                    Invoice #{invoice.invoiceNumber || invoice.qbTxnNumber || "—"}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Status: {invoice.status}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: "right" }}>
                  <Typography fontWeight={800}>
                    {money(invoice.totalAmount)}
                  </Typography>

                  <Button
                    size="small"
                    component={Link}
                    href={`/client/invoices/${invoice.invoiceId}`}
                  >
                    View
                  </Button>
                </Box>
              </Box>
            ))
          )}
        </CardContent>
      </Card>
    </Box>
  );
}