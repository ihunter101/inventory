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

function money(value: number | string | null | undefined) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function date(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

function getStatusColor(status: string) {
  if (status === "PAID") return "success";
  if (status === "OVERDUE") return "error";
  if (status === "PARTIALLY_PAID") return "warning";
  return "default";
}

export default function ClientInvoiceDetailPage() {
  const params = useParams();
  const invoiceId = String(params.invoiceId);

  const { data, isLoading, isError, error } =
    useGetClientInvoiceByIdQuery(invoiceId);

  React.useEffect(() => {
    if (error) {
      console.log("Client invoice detail error:", error);
    }
  }, [error]);

  if (isLoading) {
    return <Typography>Loading invoice...</Typography>;
  }

  if (isError || !data?.invoice) {
    return (
      <Box>
        <Typography color="error" sx={{ mb: 2 }}>
          Invoice not found or you do not have access to it.
        </Typography>

        <Button component={Link} href="/client/invoices" variant="outlined">
          Back to Invoices
        </Button>
      </Box>
    );
  }

  const invoice = data.invoice;

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
    {
      field: "itemName",
      headerName: "Item",
      flex: 1,
      minWidth: 180,
    },
    {
      field: "description",
      headerName: "Description",
      flex: 1.7,
      minWidth: 280,
    },
    {
      field: "className",
      headerName: "Class",
      flex: 0.8,
      minWidth: 140,
    },
    {
      field: "serviceDate",
      headerName: "Service Date",
      flex: 0.7,
      minWidth: 140,
    },
    {
      field: "quantity",
      headerName: "Qty",
      flex: 0.4,
      minWidth: 90,
      align: "right",
      headerAlign: "right",
    },
    {
      field: "rate",
      headerName: "Rate",
      flex: 0.5,
      minWidth: 110,
      align: "right",
      headerAlign: "right",
      renderCell: (params) =>
        params.row.rate === "—" ? "—" : money(params.row.rate),
    },
    {
      field: "amount",
      headerName: "Amount",
      flex: 0.6,
      minWidth: 120,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <Typography fontWeight={800}>{money(params.row.amount)}</Typography>
      ),
    },
  ];

  return (
    <Box>
      <Button
        component={Link}
        href="/client/invoices"
        variant="outlined"
        sx={{ mb: 2 }}
      >
        ← Back to Invoices
      </Button>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>
          Invoice #{invoice.invoiceNumber || invoice.qbTxnNumber || "—"}
        </Typography>

        <Typography color="text.secondary">
          {invoice.customer?.companyName || invoice.customerName}
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 4, boxShadow: 2, height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                Invoice Details
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography color="text.secondary">Invoice Date</Typography>
                  <Typography fontWeight={700}>
                    {date(invoice.invoiceDate)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography color="text.secondary">Due Date</Typography>
                  <Typography fontWeight={700}>{date(invoice.dueDate)}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography color="text.secondary">Status</Typography>
                  <Chip
                    label={invoice.status}
                    color={getStatusColor(invoice.status) as any}
                    sx={{ mt: 0.5, fontWeight: 700 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography color="text.secondary">
                    Client / Person Served
                  </Typography>
                  <Typography fontWeight={700}>
                    {invoice.subClientName || "—"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography color="text.secondary">Customer</Typography>
                  <Typography fontWeight={700}>
                    {invoice.customerName || "—"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography color="text.secondary">QuickBooks Txn #</Typography>
                  <Typography fontWeight={700}>
                    {invoice.qbTxnNumber || "—"}
                  </Typography>
                </Grid>
              </Grid>

              {invoice.memo && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography color="text.secondary">Memo</Typography>
                  <Typography>{invoice.memo}</Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 4, boxShadow: 2, height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                Balance Summary
              </Typography>

              <Box sx={{ display: "grid", gap: 1.5 }}>
                <Box>
                  <Typography color="text.secondary">Total Amount</Typography>
                  <Typography variant="h5" fontWeight={800}>
                    {money(invoice.totalAmount)}
                  </Typography>
                </Box>

                <Box>
                  <Typography color="text.secondary">Amount Paid</Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {money(invoice.amountPaid)}
                  </Typography>
                </Box>

                <Box>
                  <Typography color="text.secondary">
                    Balance Remaining
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {money(invoice.balanceRemaining)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 4, boxShadow: 2, mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
            Invoice Line Items
          </Typography>

          <DataGrid
            rows={lineRows}
            columns={lineColumns}
            autoHeight
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: {
                paginationModel: {
                  page: 0,
                  pageSize: 10,
                },
              },
            }}
            sx={{
              border: 0,
              borderRadius: 2,
              fontSize: "0.9rem",
            }}
          />
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 4, boxShadow: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
            Payments
          </Typography>

          {invoice.payments?.length ? (
            invoice.payments.map((payment) => (
              <Box
                key={payment.paymentId}
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
                    {date(payment.paymentDate)}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {payment.method || "Payment"}
                    {payment.referenceNumber
                      ? ` • Ref: ${payment.referenceNumber}`
                      : ""}
                  </Typography>

                  {payment.notes && (
                    <Typography variant="body2" color="text.secondary">
                      {payment.notes}
                    </Typography>
                  )}
                </Box>

                <Typography fontWeight={800}>
                  {money(payment.amount)}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography color="text.secondary">
              No payments recorded for this invoice.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}