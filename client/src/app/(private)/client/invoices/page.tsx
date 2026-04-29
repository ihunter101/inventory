"use client";

import * as React from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useGetClientInvoicesQuery } from "@/app/state/api";

function money(value: number | string | null | undefined) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function getStatusColor(status: string) {
  if (status === "PAID") return "success";
  if (status === "OVERDUE") return "error";
  if (status === "PARTIALLY_PAID") return "warning";
  return "default";
}

export default function ClientInvoicesPage() {
  const theme = useTheme();

  const [search, setSearch] = React.useState("");
  const [paginationModel, setPaginationModel] = React.useState({
    page: 0,
    pageSize: 10,
  });

  const { data, isLoading, isError, error } = useGetClientInvoicesQuery({
    page: paginationModel.page + 1,
    limit: paginationModel.pageSize,
    search,
  });

  React.useEffect(() => {
    if (error) {
      console.log("Client invoices error:", error);
    }
  }, [error]);

  const rows =
    data?.invoices?.map((invoice) => ({
      id: invoice.invoiceId,
      invoiceId: invoice.invoiceId,
      invoiceNumber: invoice.invoiceNumber || invoice.qbTxnNumber || "—",
      customerName: invoice.customerName || "—",
      subClientName: invoice.subClientName || "—",
      invoiceDate: invoice.invoiceDate
        ? new Date(invoice.invoiceDate).toLocaleDateString()
        : "—",
      dueDate: invoice.dueDate
        ? new Date(invoice.dueDate).toLocaleDateString()
        : "—",
      totalAmount: invoice.totalAmount,
      amountPaid: invoice.amountPaid,
      balanceRemaining: invoice.balanceRemaining,
      status: invoice.status,
    })) ?? [];

  const columns: GridColDef[] = [
    {
      field: "invoiceNumber",
      headerName: "Invoice #",
      flex: 0.8,
      minWidth: 140,
      renderCell: (params) => (
        <Typography fontWeight={700}>
          {params.row.invoiceNumber}
        </Typography>
      ),
    },
    {
      field: "subClientName",
      headerName: "Client / Person Served",
      flex: 1.2,
      minWidth: 220,
    },
    {
      field: "invoiceDate",
      headerName: "Invoice Date",
      flex: 0.8,
      minWidth: 140,
    },
    {
      field: "dueDate",
      headerName: "Due Date",
      flex: 0.8,
      minWidth: 140,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.7,
      minWidth: 150,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.row.status}
          color={getStatusColor(params.row.status) as any}
          sx={{ fontWeight: 700 }}
        />
      ),
    },
    {
      field: "totalAmount",
      headerName: "Total",
      flex: 0.7,
      minWidth: 130,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <Typography fontWeight={700}>
          {money(params.row.totalAmount)}
        </Typography>
      ),
    },
    {
      field: "amountPaid",
      headerName: "Paid",
      flex: 0.7,
      minWidth: 130,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <Typography fontWeight={700}>
          {money(params.row.amountPaid)}
        </Typography>
      ),
    },
    {
      field: "balanceRemaining",
      headerName: "Balance",
      flex: 0.7,
      minWidth: 130,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <Typography fontWeight={800}>
          {money(params.row.balanceRemaining)}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Action",
      flex: 0.6,
      minWidth: 120,
      sortable: false,
      filterable: false,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          component={Link}
          href={`/client/invoices/${params.row.invoiceId}`}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>
          My Invoices
        </Typography>

        <Typography color="text.secondary">
          View invoices linked to your organization.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 4, boxShadow: 2 }}>
        <CardHeader
          title={<Typography fontWeight={800}>Invoices</Typography>}
          subheader="Only invoices belonging to your organization are shown."
        />

        <CardContent>
          <TextField
            fullWidth
            size="small"
            label="Search invoices"
            placeholder="Search by invoice number, customer, or sub-client"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            sx={{ mb: 2 }}
          />

          {isError && (
            <Typography color="error" sx={{ mb: 2 }}>
              Failed to load invoices. Check Network tab for the exact backend message.
            </Typography>
          )}

          <DataGrid
            rows={rows}
            columns={columns}
            autoHeight
            loading={isLoading}
            rowCount={data?.total ?? 0}
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[5, 10, 25, 50]}
            disableRowSelectionOnClick
            getRowId={(row) => row.id}
            sx={{
              border: 0,
              borderRadius: 2,
              fontSize: "0.9rem",
              "& .MuiDataGrid-row:hover": {
                backgroundColor:
                  theme.palette.mode === "dark" ? "#334155" : "#f0fdfa",
              },
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );
}