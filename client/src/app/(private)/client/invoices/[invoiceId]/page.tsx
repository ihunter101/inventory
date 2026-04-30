"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useGetClientInvoiceByIdQuery } from "@/app/state/api";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

function money(value: number | string | null | undefined) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function date(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
}

function getStatusStyles(status: string) {
  if (status === "PAID") return { bg: "#dcfce7", color: "#15803d", border: "#86efac" };
  if (status === "OVERDUE") return { bg: "#fee2e2", color: "#dc2626", border: "#fca5a5" };
  if (status === "PARTIALLY_PAID") return { bg: "#fef9c3", color: "#a16207", border: "#fde047" };
  return { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };
}

const labelStyle = {
  fontSize: "0.7rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "#94a3b8",
  mb: 0.5,
};

const valueStyle = {
  fontSize: "0.975rem",
  fontWeight: 600,
  color: "#0f172a",
};

export default function ClientInvoiceDetailPage() {
  const params = useParams();
  const invoiceId = String(params.invoiceId);

  const { data, isLoading, isError, error } =
    useGetClientInvoiceByIdQuery(invoiceId);

  React.useEffect(() => {
    if (error) console.log("Client invoice detail error:", error);
  }, [error]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "#64748b", pt: 4 }}>
        <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem" }}>
          Loading invoice…
        </Typography>
      </Box>
    );
  }

  if (isError || !data?.invoice) {
    return (
      <Box sx={{ pt: 4 }}>
        <Typography sx={{ color: "#ef4444", mb: 2, fontFamily: "'DM Sans', sans-serif" }}>
          Invoice not found or you do not have access to it.
        </Typography>
        <Button
          component={Link}
          href="/client/invoices"
          startIcon={<ArrowBackIcon />}
          sx={backBtnSx}
        >
          Back to Invoices
        </Button>
      </Box>
    );
  }

  const invoice = data.invoice;
  const statusStyles = getStatusStyles(invoice.status);

  const lineRows =
    invoice.lines?.map((line) => ({
      id: line.lineId,
      itemName: line.itemName || "—",
      description: line.description || "—",
      className: line.className || "—",
      quantity: line.quantity ?? "—",
      rate: line.rate ?? "—",
      amount: line.amount ?? 0,
      serviceDate: date(line.serviceDate),
    })) ?? [];

  const lineColumns: GridColDef[] = [
    { field: "itemName", headerName: "Item", flex: 1, minWidth: 180 },
    { field: "description", headerName: "Description", flex: 1.7, minWidth: 280 },
    { field: "className", headerName: "Class", flex: 0.8, minWidth: 140 },
    { field: "serviceDate", headerName: "Service Date", flex: 0.7, minWidth: 140 },
    { field: "quantity", headerName: "Qty", flex: 0.4, minWidth: 90, align: "right", headerAlign: "right" },
    {
      field: "rate", headerName: "Rate", flex: 0.5, minWidth: 110, align: "right", headerAlign: "right",
      renderCell: (p) => p.row.rate === "—" ? "—" : money(p.row.rate),
    },
    {
      field: "amount", headerName: "Amount", flex: 0.6, minWidth: 120, align: "right", headerAlign: "right",
      renderCell: (p) => (
        <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>
          {money(p.row.amount)}
        </Typography>
      ),
    },
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 3 }, py: 3, fontFamily: "'DM Sans', sans-serif" }}>

      {/* Back button */}
      <Button
        component={Link}
        href="/client/invoices"
        startIcon={<ArrowBackIcon sx={{ fontSize: "1rem !important" }} />}
        sx={backBtnSx}
      >
        Back to Invoices
      </Button>

      {/* Page header */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 2, mt: 3, mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 48, height: 48, borderRadius: 2.5,
              background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px rgba(59,130,246,0.35)",
              flexShrink: 0,
            }}
          >
            <ReceiptLongIcon sx={{ color: "#fff", fontSize: "1.35rem" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: "1.65rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              Invoice #{invoice.invoiceNumber || invoice.qbTxnNumber || "—"}
            </Typography>
            <Typography sx={{ color: "#64748b", fontSize: "0.92rem", fontWeight: 500, mt: 0.25 }}>
              {invoice.customer?.companyName || invoice.customerName}
            </Typography>
          </Box>
        </Box>

        {/* Status badge */}
        <Box
          sx={{
            px: 2, py: 0.75, borderRadius: 99,
            background: statusStyles.bg,
            border: `1.5px solid ${statusStyles.border}`,
            color: statusStyles.color,
            fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.06em",
            textTransform: "uppercase", alignSelf: "center",
          }}
        >
          {invoice.status}
        </Box>
      </Box>

      {/* Top row: details + balance */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        {/* Invoice Details */}
        <Grid item xs={12} md={8}>
          <SectionCard title="Invoice Details">
            <Grid container spacing={2.5}>
              <DetailField label="Invoice Date" value={date(invoice.invoiceDate)} />
              <DetailField label="Due Date" value={date(invoice.dueDate)} />
              <DetailField label="Client / Person Served" value={invoice.subClientName || "—"} />
              <DetailField label="Customer" value={invoice.customerName || "—"} />
              <DetailField label="QuickBooks Txn #" value={invoice.qbTxnNumber || "—"} />
            </Grid>

            {invoice.memo && (
              <>
                <Divider sx={{ my: 2.5, borderColor: "#f1f5f9" }} />
                <Box>
                  <Typography sx={labelStyle}>Memo</Typography>
                  <Typography sx={{ color: "#334155", fontSize: "0.92rem", lineHeight: 1.6 }}>
                    {invoice.memo}
                  </Typography>
                </Box>
              </>
            )}
          </SectionCard>
        </Grid>

        {/* Balance Summary */}
        <Grid item xs={12} md={4}>
          <SectionCard title="Balance Summary">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <BalanceRow label="Total Amount" value={money(invoice.totalAmount)} size="xl" />
              <Divider sx={{ borderColor: "#f1f5f9" }} />
              <BalanceRow label="Amount Paid" value={money(invoice.amountPaid)} size="lg" color="#15803d" />
              <BalanceRow label="Balance Remaining" value={money(invoice.balanceRemaining)} size="lg" color="#1e40af" />
            </Box>
          </SectionCard>
        </Grid>
      </Grid>

      {/* Line Items */}
      <SectionCard title="Line Items" sx={{ mb: 2.5 }}>
        <DataGrid
          rows={lineRows}
          columns={lineColumns}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[5, 10, 25]}
          initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
          sx={{
            border: 0,
            fontSize: "0.875rem",
            fontFamily: "'DM Sans', sans-serif",
            "& .MuiDataGrid-columnHeaders": {
              background: "#f8fafc",
              borderRadius: "10px",
              border: "none",
              "& .MuiDataGrid-columnHeaderTitle": {
                fontWeight: 700,
                fontSize: "0.72rem",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "#94a3b8",
              },
            },
            "& .MuiDataGrid-row": {
              borderRadius: 1,
              "&:hover": { background: "#f8fafc" },
            },
            "& .MuiDataGrid-cell": {
              borderBottom: "1px solid #f1f5f9",
              color: "#334155",
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: "1px solid #f1f5f9",
            },
          }}
        />
      </SectionCard>

      {/* Payments */}
      <SectionCard title="Payments">
        {invoice.payments?.length ? (
          <Box>
            {invoice.payments.map((payment, idx) => (
              <Box
                key={payment.paymentId}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  py: 2,
                  px: 2,
                  borderRadius: 2,
                  gap: 2,
                  background: idx % 2 === 0 ? "#f8fafc" : "transparent",
                  transition: "background 0.15s",
                  "&:hover": { background: "#f1f5f9" },
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>
                    {date(payment.paymentDate)}
                  </Typography>
                  <Typography sx={{ fontSize: "0.82rem", color: "#64748b", mt: 0.25 }}>
                    {payment.method || "Payment"}
                    {payment.referenceNumber ? ` · Ref: ${payment.referenceNumber}` : ""}
                  </Typography>
                  {payment.notes && (
                    <Typography sx={{ fontSize: "0.82rem", color: "#94a3b8", mt: 0.15 }}>
                      {payment.notes}
                    </Typography>
                  )}
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "#15803d", whiteSpace: "nowrap" }}>
                  {money(payment.amount)}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ py: 3, textAlign: "center" }}>
            <Typography sx={{ color: "#94a3b8", fontSize: "0.9rem" }}>
              No payments recorded for this invoice.
            </Typography>
          </Box>
        )}
      </SectionCard>
    </Box>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function SectionCard({ title, children, sx }: { title: string; children: React.ReactNode; sx?: object }) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1.5px solid #e2e8f0",
        background: "#fff",
        boxShadow: "0 1px 6px rgba(15,23,42,0.05)",
        ...sx,
      }}
    >
      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        <Typography
          sx={{
            fontSize: "0.8rem",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#94a3b8",
            mb: 2.5,
          }}
        >
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <Grid item xs={12} sm={6}>
      <Typography sx={labelStyle}>{label}</Typography>
      <Typography sx={valueStyle}>{value}</Typography>
    </Grid>
  );
}

function BalanceRow({
  label, value, size, color,
}: {
  label: string; value: string; size: "xl" | "lg"; color?: string;
}) {
  return (
    <Box>
      <Typography sx={labelStyle}>{label}</Typography>
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: size === "xl" ? "1.85rem" : "1.25rem",
          color: color || "#0f172a",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

const backBtnSx = {
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.85rem",
  color: "#475569",
  border: "1.5px solid #e2e8f0",
  borderRadius: 2,
  px: 2,
  py: 0.75,
  background: "#fff",
  fontFamily: "'DM Sans', sans-serif",
  "&:hover": {
    background: "#f8fafc",
    borderColor: "#cbd5e1",
  },
};