"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  useTheme,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useGetOrganizationsQuery } from "@/app/state/api";

export function OrganizationsTable() {
  const theme = useTheme();

  const { data, isLoading, isError } = useGetOrganizationsQuery();

  const organizations = data?.organizations ?? [];

  const rows = organizations.map((org) => ({
    id: org.organizationId,
    organizationId: org.organizationId,
    name: org.name,
    customerName: org.customer?.companyName || org.customer?.name || "No customer",
    email: org.customer?.email || "—",
    phone: org.customer?.phone || "—",
    userCount: org.users?.length ?? 0,
    totalBalance: org.customer?.totalBalance ?? org.customer?.balance ?? 0,
  }));

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Organization",
      flex: 1.3,
      minWidth: 220,
      renderCell: (params) => (
        <Box>
          <Typography fontWeight={700}>{params.row.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.organizationId.substring(0, 12)}...
          </Typography>
        </Box>
      ),
    },
    {
      field: "customerName",
      headerName: "Linked QuickBooks Customer",
      flex: 1.4,
      minWidth: 240,
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
      minWidth: 180,
    },
    {
      field: "phone",
      headerName: "Phone",
      flex: 0.8,
      minWidth: 150,
    },
    {
      field: "userCount",
      headerName: "Users",
      flex: 0.5,
      minWidth: 100,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.row.userCount}
          color={params.row.userCount > 0 ? "success" : "default"}
        />
      ),
    },
    {
      field: "totalBalance",
      headerName: "Balance",
      flex: 0.7,
      minWidth: 130,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <Typography fontWeight={600}>
          ${Number(params.row.totalBalance || 0).toFixed(2)}
        </Typography>
      ),
    },
  ];

  return (
    <Card sx={{ borderRadius: "16px", boxShadow: 3 }}>
      <CardHeader
        title={<Typography fontWeight={700}>Organizations</Typography>}
        subheader="Client organizations linked to QuickBooks customers"
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      />

      <CardContent>
        {isLoading && <Typography>Loading organizations...</Typography>}

        {isError && (
          <Typography color="error">
            Failed to load organizations.
          </Typography>
        )}

        {!isLoading && !isError && (
          <DataGrid
            rows={rows}
            columns={columns}
            autoHeight
            rowHeight={64}
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: {
                paginationModel: {
                  page: 0,
                  pageSize: 5,
                },
              },
            }}
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
        )}
      </CardContent>
    </Card>
  );
}