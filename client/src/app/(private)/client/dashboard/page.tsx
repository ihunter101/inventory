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
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";

function money(value: number | string | null | undefined) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function date(value: string | null | undefined) {
  return value
    ? new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "—";
}

function getStatusStyles(status: string) {
  if (status === "PAID") return { bg: "#dcfce7", color: "#15803d", border: "#86efac" };
  if (status === "OVERDUE") return { bg: "#fee2e2", color: "#dc2626", border: "#fca5a5" };
  if (status === "PARTIALLY_PAID") return { bg: "#fef9c3", color: "#a16207", border: "#fde047" };
  return { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };
}

export default function ClientDashboardPage() {
  const { data, isLoading, isError } = useGetClientDashboardQuery();

  if (isLoading) {
    return (
      <Box sx={{ pt: 4, fontFamily: "'DM Sans', sans-serif" }}>
        <Typography sx={{ color: "#64748b", fontSize: "0.95rem" }}>
          Loading dashboard…
        </Typography>
      </Box>
    );
  }

  if (isError || !data) {
    return (
      <Box sx={{ pt: 4, fontFamily: "'DM Sans', sans-serif" }}>
        <Typography sx={{ color: "#ef4444", fontSize: "0.95rem" }}>
          Failed to load client dashboard.
        </Typography>
      </Box>
    );
  }

  const summaryCards = [
    {
      label: "Total Billed",
      value: money(data.summary.totalBilled),
      icon: <AccountBalanceWalletIcon sx={{ fontSize: "1.2rem" }} />,
      iconBg: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
      iconShadow: "0 4px 12px rgba(59,130,246,0.3)",
    },
    {
      label: "Total Paid",
      value: money(data.summary.totalPaid),
      icon: <CheckCircleOutlineIcon sx={{ fontSize: "1.2rem" }} />,
      iconBg: "linear-gradient(135deg, #15803d 0%, #22c55e 100%)",
      iconShadow: "0 4px 12px rgba(34,197,94,0.3)",
    },
    {
      label: "Outstanding",
      value: money(data.summary.totalOutstanding),
      icon: <PendingActionsIcon sx={{ fontSize: "1.2rem" }} />,
      iconBg: "linear-gradient(135deg, #b45309 0%, #f59e0b 100%)",
      iconShadow: "0 4px 12px rgba(245,158,11,0.3)",
    },
    {
      label: "Open Invoices",
      value: data.summary.openInvoices,
      icon: <ReceiptLongIcon sx={{ fontSize: "1.2rem" }} />,
      iconBg: "linear-gradient(135deg, #6d28d9 0%, #a78bfa 100%)",
      iconShadow: "0 4px 12px rgba(167,139,250,0.3)",
    },
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 3 }, py: 3, fontFamily: "'DM Sans', sans-serif" }}>

      {/* Page header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          sx={{
            fontSize: "1.65rem",
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          Welcome, {data.organization.name}
        </Typography>
        <Typography sx={{ color: "#64748b", fontSize: "0.92rem", fontWeight: 500, mt: 0.5 }}>
          Account linked to {data.customer.companyName || data.customer.name}
        </Typography>
      </Box>

      {/* Summary stat cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {summaryCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1.5px solid #e2e8f0",
                background: "#fff",
                boxShadow: "0 1px 6px rgba(15,23,42,0.05)",
                transition: "box-shadow 0.2s, transform 0.2s",
                "&:hover": {
                  boxShadow: "0 6px 20px rgba(15,23,42,0.09)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#94a3b8",
                    }}
                  >
                    {card.label}
                  </Typography>
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: 2,
                      background: card.iconBg,
                      boxShadow: card.iconShadow,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {card.icon}
                  </Box>
                </Box>
                <Typography
                  sx={{
                    fontSize: "1.6rem",
                    fontWeight: 800,
                    color: "#0f172a",
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Invoices */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1.5px solid #e2e8f0",
          background: "#fff",
          boxShadow: "0 1px 6px rgba(15,23,42,0.05)",
        }}
      >
        <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
          {/* Section header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
            <Box>
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#94a3b8",
                  mb: 0.5,
                }}
              >
                Recent Invoices
              </Typography>
              <Typography sx={{ fontSize: "0.9rem", color: "#64748b" }}>
                Latest invoices from your account
              </Typography>
            </Box>
            <Button
              component={Link}
              href="/client/invoices"
              endIcon={<ArrowForwardIcon sx={{ fontSize: "0.9rem !important" }} />}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.82rem",
                color: "#1e40af",
                border: "1.5px solid #bfdbfe",
                borderRadius: 2,
                px: 2,
                py: 0.75,
                background: "#eff6ff",
                fontFamily: "'DM Sans', sans-serif",
                "&:hover": { background: "#dbeafe", borderColor: "#93c5fd" },
              }}
            >
              View All
            </Button>
          </Box>

          {/* Invoice list */}
          {data.recentInvoices.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography sx={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                No invoices found.
              </Typography>
            </Box>
          ) : (
            <Box>
              {/* Column headers */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto auto",
                  gap: 2,
                  px: 2,
                  py: 1,
                  background: "#f8fafc",
                  borderRadius: 2,
                  mb: 1,
                }}
              >
                {["Invoice", "Status", "Amount", ""].map((h) => (
                  <Typography
                    key={h}
                    sx={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      color: "#94a3b8",
                    }}
                  >
                    {h}
                  </Typography>
                ))}
              </Box>

              {data.recentInvoices.map((invoice, idx) => {
                const statusStyles = getStatusStyles(invoice.status);
                return (
                  <Box
                    key={invoice.invoiceId}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto auto auto",
                      gap: 2,
                      alignItems: "center",
                      px: 2,
                      py: 1.75,
                      borderRadius: 2,
                      background: idx % 2 === 0 ? "transparent" : "#f8fafc",
                      transition: "background 0.15s",
                      "&:hover": { background: "#f1f5f9" },
                    }}
                  >
                    {/* Invoice # */}
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", color: "#0f172a" }}>
                        Invoice #{invoice.invoiceNumber || invoice.qbTxnNumber || "—"}
                      </Typography>
                      {invoice.invoiceDate && (
                        <Typography sx={{ fontSize: "0.78rem", color: "#94a3b8", mt: 0.15 }}>
                          {date(invoice.invoiceDate)}
                        </Typography>
                      )}
                    </Box>

                    {/* Status pill */}
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.4,
                        borderRadius: 99,
                        background: statusStyles.bg,
                        border: `1.5px solid ${statusStyles.border}`,
                        color: statusStyles.color,
                        fontWeight: 700,
                        fontSize: "0.72rem",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {invoice.status}
                    </Box>

                    {/* Amount */}
                    <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a", whiteSpace: "nowrap" }}>
                      {money(invoice.totalAmount)}
                    </Typography>

                    {/* View link */}
                    <Button
                      size="small"
                      component={Link}
                      href={`/client/invoices/${invoice.invoiceId}`}
                      endIcon={<ArrowOutwardIcon sx={{ fontSize: "0.8rem !important" }} />}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.78rem",
                        color: "#475569",
                        border: "1.5px solid #e2e8f0",
                        borderRadius: 1.5,
                        px: 1.5,
                        py: 0.4,
                        minWidth: 0,
                        fontFamily: "'DM Sans', sans-serif",
                        "&:hover": { background: "#f8fafc", borderColor: "#cbd5e1" },
                      }}
                    >
                      View
                    </Button>
                  </Box>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}