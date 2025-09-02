"use client";

import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Container,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as EyeIcon,
} from "@mui/icons-material";

import { useGetUsersQuery } from "../state/api";

export default function UsersPage() {
  const { data: users = [], isLoading, isError } = useGetUsersQuery();

  const rows = users.map((u: any) => ({
    id: u.userId,
    name: u.name,
    email: u.email,
    role: u.role,
  }));

    const [paginationModel, setPaginationModel] = React.useState({
        page: 0,
        pageSize: 10, // default value
    });

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      flex: 1.2,
      minWidth: 200,
      renderCell: (params) => (
        <Box>
          <Typography fontWeight={600}>{params.row.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            ID: {params.row.id}
          </Typography>
        </Box>
      ),
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1.5,
      minWidth: 240,
    },
    {
      field: "role",
      headerName: "Role",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Typography
          fontWeight={600}
          sx={{
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            bgcolor: "#EEF2FF",
            color: "#3730A3",
            fontSize: "0.85rem",
            textTransform: "capitalize",
          }}
        >
          {params.row.role}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.5,
      minWidth: 130,
      sortable: false,
      filterable: false,
      renderCell: () => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="View">
            <IconButton size="small" sx={{ color: "#3b82f6" }}>
              <EyeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" sx={{ color: "#10b981" }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" sx={{ color: "#ef4444" }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Users
      </Typography>

      <Card sx={{ borderRadius: "16px", boxShadow: 3 }}>
        <CardHeader
          title={<Typography fontWeight={700}>Users Table</Typography>}
          sx={{ borderBottom: "1px solid #eee", backgroundColor: "#f9fafb" }}
        />
        <CardContent>
          {isLoading && <Typography>Loading users...</Typography>}
          {isError && (
            <Typography color="error">
              Failed to load users from database.
            </Typography>
          )}

          {!isLoading && !isError && (
            <div style={{ width: "100%" }}>
              <DataGrid
                rows={rows}
                columns={columns}
                autoHeight
                rowHeight={64}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[5, 10, 25]}
                disableRowSelectionOnClick
                getRowId={(r) => r.id}
                sx={{
                    border: 0,
                    borderRadius: 2,
                    fontSize: "0.9rem",
                    "& .MuiDataGrid-columnHeader": {
                    backgroundColor: "#f9fafb",
                    fontWeight: "bold",
                    },
                    "& .MuiDataGrid-row:hover": {
                    backgroundColor: "#f3f4f6",
                    },
                }}
                />
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
