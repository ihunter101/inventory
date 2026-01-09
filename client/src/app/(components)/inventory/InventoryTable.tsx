import * as React from "react";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Alert,
} from "@mui/material";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";

import { expiryColor, statusChip } from "../../utils/stock";
import { InventoryRow, formatNumber, deriveStatus } from "./InventoryTypes";
import { InventoryAction } from "./InventoryRowActions";
import { useRouter } from "next/navigation";

type Props = {
  rows: InventoryRow[];
  isError: boolean;
  error: unknown;
  onRefresh: () => void;
  adjusting: boolean;
  setting: boolean;
  onQuickAdjust: (row: InventoryRow, delta: number, reason?: string) => void;
  onOpenStocktake: (row: InventoryRow) => void;
};

export const InventoryTable: React.FC<Props> = ({
  rows,
  isError,
  error,
  onRefresh,
  adjusting,
  setting,
  onQuickAdjust,
  onOpenStocktake,
}) => {

  const router = useRouter();

  const [editRow, setEditRow] = React.useState({})
  const columns = React.useMemo<GridColDef<InventoryRow>[]>(
    () => [
      {
        field: "name",
        headerName: "Item",
        flex: 1.2,
        minWidth: 260,
        renderCell: (params) => (
          <Box>
            <Typography
              fontWeight={600}
              sx={{ fontSize: "0.95rem", lineHeight: 1.4 }}
            >
              {params.row.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#6b7280",
                fontSize: "0.75rem",
                display: "block",
                mt: 0.5,
              }}
            >
              Supplier: {params.row.supplier ?? "-"} • ID:{" "}
              {params.row.productId}
            </Typography>
          </Box>
        ),
      },
      {
        field: "category",
        headerName: "Category",
        minWidth: 140,
        flex: 0.5,
        valueGetter: (_v, row) => row.category ?? "other",
      },
      {
        field: "stockQuantity",
        headerName: "Quantity",
        minWidth: 200,
        flex: 0.7,
        headerAlign: "center",
        align: "center",
        renderCell: (p) => (
          <Box sx={{ width: "100%", textAlign: "center", pr: 0.5 }}>
            <Typography sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
              {formatNumber(p.row.stockQuantity)}{" "}
              <Typography
                component="span"
                sx={{ fontWeight: 500, color: "#6b7280" }}
              >
                {p.row.unit ?? "pcs"}
              </Typography>
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#6b7280",
                display: "block",
                mt: 0.25,
                whiteSpace: "nowrap",
              }}
            >
              Min: {formatNumber(p.row.minQuantity)} {p.row.unit ?? "pcs"}
              {typeof p.row.reorderPoint === "number" && (
                <> • RP: {formatNumber(p.row.reorderPoint)}</>
              )}
            </Typography>
          </Box>
        ),
        sortComparator: (a, b) => (a ?? 0) - (b ?? 0),
      },
      {
        field: "expiryDate",
        headerName: "Expiry",
        description: "shows the date of expiry in MM/DD/YYYY",
        headerAlign: "center",
        align: "center",
        minWidth: 150,
        flex: 0.6,
        renderCell: (p) => {
          const iso = p.row.expiryDate ?? "";
          if (!iso)
            return (
              <Typography variant="caption" sx={{ color: "#6b7280" }}>
                —
              </Typography>
            );
          const color = expiryColor(iso) as any;
          return (
            <Chip
              size="small"
              variant="outlined"
              color={color} // "error" | "warning" | "success" | "default"
              label={new Date(iso).toLocaleDateString()}
              sx={{
                fontWeight: 600,
                borderRadius: "8px",
                px: 1.5,
                borderColor:
                  color === "error"
                    ? "#FCA5A5" // red-300
                    : color === "warning"
                    ? "#FCD34D" // amber-300
                    : color === "success"
                    ? "#6EE7B7" // emerald-300
                    : "#E5E7EB", // gray-300
                bgcolor:
                  color === "error"
                    ? "#FEE2E2" // red-100
                    : color === "warning"
                    ? "#FEF3C7" // amber-100
                    : color === "success"
                    ? "#DCFCE7" // green-100
                    : "#F3F4F6", // gray-100
                color:
                  color === "error"
                    ? "#B91C1C" // red-700
                    : color === "warning"
                    ? "#92400E" // amber-700
                    : color === "success"
                    ? "#166534" // green-700
                    : "#374151", // gray-700
              }}
            />
          );
        },
        sortComparator: (a, b) =>
          +new Date(a as string) - +new Date(b as string),
      },
      {
        field: "status",
        headerName: "Status",
        description: "the stock status is based on the Rorder-Point(RP) for 'Critical', minimum value for 'Low Stock' and otherwise 'In stock'",
        headerAlign: "center",
        align: "center",
        minWidth: 130,
        flex: 0.5,
        renderCell: (p) => statusChip(deriveStatus(p.row)),
        sortable: false,
      },
      {
        field: "actions",
        headerName: "Actions",

        minWidth: 220,
        flex: 0.7,
        sortable: false,
        filterable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (p) => (
          <InventoryAction 
            row={p.row}
            adjusting={adjusting}
            setting={setting}
            onQuickAdjust={onQuickAdjust}
            onOpenStocktake={onOpenStocktake}
            onView={(row) => router.push(`inventory/${row.productId}`)}
            onEdit={(row) => setEditRow(row)}
          />
        ),
      },
    ],
    [adjusting, setting, onQuickAdjust, onOpenStocktake]
  );

  return (
    <Card sx={{ borderRadius: "20px", overflow: "hidden", boxShadow: 4 }}>
      <CardHeader
        title={
          <Typography variant="h6" fontWeight={700} sx={{ color: "#1f2937" }}>
            Inventory
          </Typography>
        }
        sx={{ bgcolor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}
        action={
          <Button size="small" onClick={onRefresh}>
            Refresh
          </Button>
        }
      />
      <CardContent>
        {isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load inventory.{" "}
            {String(
              (error as any)?.data?.error || (error as any)?.status || ""
            )}
          </Alert>
        )}
        <div style={{ width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            autoHeight
            rowHeight={64}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
              sorting: { sortModel: [{ field: "name", sort: "asc" }] },
            }}
            getRowId={(r) => r.productId}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 300 },
              },
            }}
            sx={{
              border: 0,
              borderRadius: 2,
              fontSize: "0.9rem",
              "& .MuiDataGrid-columnHeaders": { height: 56 },
              "& .MuiDataGrid-columnHeader": {
                backgroundColor: "#f9f9fb",
                fontWeight: "bold",
                fontSize: "0.95rem",
                color: "#374151",
                display: "flex",
                alignItems: "center",
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "1px solid #f0f0f0",
                display: "flex",
                alignItems: "center",
                py: 1,
              },
              "& .MuiDataGrid-footerContainer": {
                borderTop: "1px solid #eee",
              },
              "& .MuiDataGrid-virtualScroller": { mt: "2px" },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "#f9fafb",
                transition: "0.2s ease",
              },
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};
