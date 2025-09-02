'use client';

import * as React from 'react';
import {
  Box, Card, CardHeader, CardContent, Chip, Container, Stack,
  Typography, TextField, MenuItem, Button, IconButton, Tooltip
} from '@mui/material';
import {
  DataGrid, GridColDef, GridToolbarQuickFilter
} from '@mui/x-data-grid';
import {
  Visibility as EyeIcon, Edit as EditIcon, Delete as DeleteIcon,
  Add as AddIcon, Download as DownloadIcon
} from '@mui/icons-material';

import { useGetProductsQuery } from '../state/api';
import { expiryColor, Status, statusChip } from '../utils/stock';
import TableToolbar from "../utils/Toolbar";

export type Category = 'Collection' | 'Equipment' | 'Reagent' | 'Safety';

type InventoryItem = {
  productId: string;
  name: string;
  category: Category;
  stockQuantity: number;
  minQuantity: number;
  unit?: string;
  expiry: string;
  supplier?: string;
  status: Status;
  location?: string;
};

const formatNumber = (n: number | undefined | null) =>
  new Intl.NumberFormat().format(Number(n ?? 0));

export default function InventoryPage() {
  const { data: products = [], isLoading, isError } = useGetProductsQuery();

  const rows: InventoryItem[] = React.useMemo(() => {
    return products.map((p: any): InventoryItem => ({
      productId: p.productId ?? "unknown-id",
      name: p.name,
      category: (p.category ?? "other") as Category,
      stockQuantity: Number(p.stockQuantity ?? 0),
      minQuantity: Number(p.minQuantity ?? 0),
      unit: p.unit ?? "pcs",
      expiry: p.expiryDate ?? new Date().toISOString().slice(0, 10),
      supplier: p.supplier ?? "-",
      status: (p.status ?? "in-stock") as Status,
      location: p.location ?? "-",
    }));
  }, [products]);

  const [status, setStatus] = React.useState<"all" | Status>("all");
  const [category, setCategory] = React.useState<"all" | Category>("all");

  const filtered = React.useMemo(() => {
    return rows.filter((r) => {
      const okStatus = status === "all" ? true : r.status === status;
      const okCategory = category === "all" ? true : r.category === category;
      return okStatus && okCategory;
    });
  }, [rows, status, category]);

  const columns: GridColDef<InventoryItem>[] = [
    {
      field: "name",
      headerName: "Item",
      flex: 1.2,
      minWidth: 260,
      renderCell: (params) => (
        <Box>
          <Typography fontWeight={600} sx={{ fontSize: '0.95rem', lineHeight: 1.4 }}>
            {params.row.name}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: '#6b7280', fontSize: '0.75rem', display: 'block', mt: 0.5 }}
          >
            ID: {params.row.productId} • Supplier: {params.row.supplier}
          </Typography>
        </Box>
      ),
      sortable: false,
    },
    {
      field: "category",
      headerName: "Category",
      minWidth: 140,
      flex: 0.5,
      valueGetter: (v, row) => row.category,
    },
    {
      field: "stockQuantity",
      headerName: "Quantity",
      minWidth: 170,
      flex: 0.6,
      headerAlign: 'right',
      align: 'right',
      renderCell: (p) => (
        <Box sx={{ width: '100%', textAlign: 'right', pr: 0.5 }}>
          <Typography sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
            {formatNumber(p.row.stockQuantity)}{' '}
            <Typography component="span" sx={{ fontWeight: 500, color: '#6b7280' }}>
              {p.row.unit}
            </Typography>
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: '#6b7280', display: 'block', mt: 0.25, whiteSpace: 'nowrap' }}
          >
            Min: {formatNumber(p.row.minQuantity)} {p.row.unit}
          </Typography>
        </Box>
      ),
      sortComparator: (a, b) => (a ?? 0) - (b ?? 0),

    },
    { field: "location", headerName: "Location", minWidth: 140, flex: 0.5 },
    {
      field: "expiry",
      headerName: "Expiry-Date",
      minWidth: 150,
      flex: 0.6,
      renderCell: (p) => (
        <Chip
          size="small"
          variant="outlined"
          color={expiryColor(p.row.expiry) as any}
          label={new Date(p.row.expiry).toLocaleDateString()}
          sx={{
            fontWeight: 600,
            borderRadius: '8px',
            px: 1.5,
            bgcolor:
              expiryColor(p.row.expiry) === 'error' ? '#ffe6e6' : '#e6f4ea',
            color:
              expiryColor(p.row.expiry) === 'error' ? '#b71c1c' : '#1b5e20',
          }}
        />
      ),
      sortComparator: (a, b) => +new Date(a as string) - +new Date(b as string),
    },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 130,
      flex: 0.5,
      renderCell: (p) => statusChip(p.row.status),
      sortable: false
    },
    {
      field: 'actions',
      headerName: 'Actions',
      minWidth: 130,
      flex: 0.5,
      sortable: false,
      filterable: false,
      renderCell: () => (
        <Stack direction='row' spacing={1}>
          <Tooltip title="View">
            <IconButton size='small' sx={{ color: '#3b82f6', bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' }}}>
              <EyeIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size='small' sx={{ color: '#10b981', bgcolor: '#ecfdf5', '&:hover': { bgcolor: '#d1fae5' }}}>
              <EditIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size='small' sx={{ color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' }}}>
              <DeleteIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Container maxWidth='lg' sx={{ py: 4 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems='center' spacing={2} mb={2}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ color: '#1a237e' }}>
            Lab Services Inventory
          </Typography>
          <Typography color='text.secondary' sx={{ fontSize: '0.95rem' }}>
            Track and Manage Medical Supplies & Equipment
          </Typography>
        </Box>
        <Stack direction='row' spacing={1}>
          <Button startIcon={<AddIcon />} variant="contained" sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}>Add Item</Button>
          <Button startIcon={<DownloadIcon />} variant='outlined'>Export</Button>
        </Stack>
      </Stack>

      <Card sx={{ mb: 2, borderRadius: '16px', boxShadow: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              label="Category"
              size="small"
              sx={{ minWidth: 180, bgcolor: 'white', borderRadius: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' }}}
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
            >
              <MenuItem value="all">All Categories</MenuItem>
              <MenuItem value="Collection">Collection</MenuItem>
              <MenuItem value="Equipment">Equipment</MenuItem>
              <MenuItem value="Reagent">Reagent</MenuItem>
              <MenuItem value="Safety">Safety</MenuItem>
            </TextField>

            <TextField
              select
              label="Status"
              size="small"
              sx={{ minWidth: 180, bgcolor: 'white', borderRadius: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' }}}
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="in-stock">In Stock</MenuItem>
              <MenuItem value="low-stock">Low Stock</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </TextField>
            <Box sx={{ flexGrow: 1 }} />
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: '20px', overflow: 'hidden', boxShadow: 4 }}>
        <CardHeader
          title={<Typography variant="h6" fontWeight={700} sx={{ color: '#1f2937' }}>Inventory</Typography>}
          sx={{ bgcolor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}
        />
        <CardContent>
          {isLoading && <Typography sx={{ p: 2 }}>Loading inventory...</Typography>}
          {isError && <Typography color="error" sx={{ p: 2 }}>Failed to load: {(isError as any)?.status ?? "unknown error"}</Typography>}
          {!isLoading && !isError && (
            <div style={{ width: '100%' }}>
              <DataGrid
                rows={filtered}
                columns={columns}
                autoHeight
                rowHeight={64}
                disableRowSelectionOnClick
                pageSizeOptions={[5, 10, 25]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                  sorting: { sortModel: [{ field: 'name', sort: 'asc' }] },
                }}
                slots={{ toolbar: TableToolbar }}
                getRowId={(r) => r.productId}
                sx={{
                  border: 0,
                  borderRadius: 2,
                  fontSize: '0.9rem',
                  '& .MuiDataGrid-columnHeaders': { height: 56 },
                  '& .MuiDataGrid-columnHeader': {
                    backgroundColor: '#f9f9fb',
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                  },
                  '& .MuiDataGrid-cell': {
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    py: 1,
                  },
                  '& .MuiDataGrid-footerContainer': { borderTop: '1px solid #eee' },
                  '& .MuiDataGrid-virtualScroller': { mt: '2px' },
                  '& .MuiDataGrid-row:hover': {
                    backgroundColor: '#f9fafb',
                    transition: '0.2s ease',
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




















































{/*

"use client";

import Header from "../(components)/Header";
import { useGetProductsQuery } from "../state/api";
import { DataGrid, GridColDef } from "@mui/x-data-grid"

const columns: GridColDef[] = [
   { field: "productId", headerName: "ID", width: 90 },
   { field: "name", headerName: "Product Name", width: 200 },
   { field: "price", headerName: "Price", width: 110, type: "number", valueGetter: (value, row) => `$${row.price}` },
   { field: "rating", headerName: "Rating", width: 200, type: "number", valueGetter: (value, row) => row.rating ? row.rating : "N/A" },
   { field: "stockQuantity", headerName: "Stock Quantity", width: 150, type:"number" },

]

const Inventory = () => {
  const { data: products, isError, isLoading } = useGetProductsQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-400 border-t-transparent"></div>
        <span className="ml-3 text-gray-600 font-medium">Loading Inventory...</span>
      </div>
    );
  }

  if (isError || !products) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="text-red-500 text-lg font-semibold">Failed to load inventory</div>
        <p className="text-gray-500 mt-2">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
        
        <Header name="Inventory" />

        <DataGrid 
            rows={products}
            columns={columns}
            getRowId={(row) => row.productId}
            checkboxSelection
            className="bg-white shadow rounded-lg border border-gray-200 mt-5 !text-gray-700"
        />
      
    </div>
  );
};

export default Inventory;
*/}