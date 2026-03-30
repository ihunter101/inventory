import * as React from "react";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Button,
  Chip,
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

  const [editRow, setEditRow] = React.useState({});

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
              className="text-foreground"
            >
              {params.row.name}
            </Typography>
            <Typography
              variant="caption"
              className="text-muted-foreground"
              sx={{
                fontSize: "0.75rem",
                display: "block",
                mt: 0.5,
              }}
            >
              Supplier: {params.row.supplier ?? "-"} • ID: {params.row.productId}
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
        field: "lot Number",
        headerName: "Lot Number",
        description:
          "A manufacturer or supplier batch identifier used to trace a specific production or receipt batch for quality control, recalls, and expiry tracking.",
        minWidth: 200,
        flex: 1,
        renderCell: (p) => (
          <Box sx={{ width: "100%", textAlign: "left", pr: 0.5 }}>
            <Typography
              sx={{ whiteSpace: "nowrap" }}
              className="text-foreground"
            >
              {p.row.lotNumber ?? "N/A"}
            </Typography>
          </Box>
        ),
      },
      {
        field: "stockQuantity",
        headerName: "Quantity",
        minWidth: 110,
        flex: 0.7,
        headerAlign: "center",
        align: "center",
        renderCell: (p) => (
          <Box sx={{ width: "100%", textAlign: "center", pr: 0.5 }}>
            <Typography
              sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
              className="text-foreground"
            >
              {formatNumber(p.row.stockQuantity)}{" "}
              <Typography
                component="span"
                sx={{ fontWeight: 500 }}
                className="text-muted-foreground"
              >
                {p.row.unit ?? "pcs"}
              </Typography>
            </Typography>
            <Typography
              variant="caption"
              className="text-muted-foreground"
              sx={{
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
        minWidth: 130,
        flex: 0.6,
        renderCell: (p) => {
          const iso = p.row.expiryDate ?? "";
          if (!iso) {
            return (
              <Typography variant="caption" className="text-muted-foreground">
                —
              </Typography>
            );
          }

          const color = expiryColor(iso) as any;

          return (
            <Chip
              size="small"
              variant="outlined"
              color={color}
              label={new Date(iso).toLocaleDateString()}
              sx={{
                fontWeight: 600,
                borderRadius: "8px",
                px: 1.5,
                borderColor:
                  color === "error"
                    ? "#FCA5A5"
                    : color === "warning"
                    ? "#FCD34D"
                    : color === "success"
                    ? "#6EE7B7"
                    : "hsl(var(--border))",
                bgcolor:
                  color === "error"
                    ? "rgba(239, 68, 68, 0.12)"
                    : color === "warning"
                    ? "rgba(245, 158, 11, 0.14)"
                    : color === "success"
                    ? "rgba(16, 185, 129, 0.14)"
                    : "hsl(var(--muted))",
                color:
                  color === "error"
                    ? "#DC2626"
                    : color === "warning"
                    ? "#B45309"
                    : color === "success"
                    ? "#059669"
                    : "hsl(var(--foreground))",
              }}
            />
          );
        },
        sortComparator: (a, b) => +new Date(a as string) - +new Date(b as string),
      },
      {
        field: "status",
        headerName: "Status",
        description:
          "the stock status is based on the Rorder-Point(RP) for 'Critical', minimum value for 'Low Stock' and otherwise 'In stock'",
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
    [adjusting, setting, onQuickAdjust, onOpenStocktake, router]
  );

  return (
    <Card
      className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
      sx={{ borderRadius: "20px" }}
    >
      <CardHeader
        title={
          <Typography
            variant="h6"
            fontWeight={700}
            className="text-foreground"
          >
            Inventory
          </Typography>
        }
        sx={{
          bgcolor: "hsl(var(--muted) / 0.35)",
          borderBottom: "1px solid hsl(var(--border))",
        }}
        action={
          <Button
            size="small"
            onClick={onRefresh}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Refresh
          </Button>
        }
      />

      <CardContent>
        {isError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>
            Failed to load inventory.{" "}
            {String((error as any)?.data?.error || (error as any)?.status || "")}
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
              color: "hsl(var(--foreground))",
              "& .MuiDataGrid-toolbarContainer": {
                padding: "10px 8px",
                borderBottom: "1px solid hsl(var(--border))",
                backgroundColor: "hsl(var(--muted) / 0.2)",
              },
              "& .MuiDataGrid-columnHeaders": {
                height: 56,
                backgroundColor: "hsl(var(--muted) / 0.35)",
                borderBottom: "1px solid hsl(var(--border))",
              },
              "& .MuiDataGrid-columnHeader": {
                fontWeight: "bold",
                fontSize: "0.95rem",
                color: "hsl(var(--foreground))",
                display: "flex",
                alignItems: "center",
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "1px solid hsl(var(--border) / 0.55)",
                display: "flex",
                alignItems: "center",
                py: 1,
              },
              "& .MuiDataGrid-footerContainer": {
                borderTop: "1px solid hsl(var(--border))",
                backgroundColor: "hsl(var(--muted) / 0.15)",
              },
              "& .MuiDataGrid-virtualScroller": {
                mt: "2px",
                backgroundColor: "transparent",
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "hsl(var(--muted) / 0.35)",
                transition: "0.2s ease",
              },
              "& .MuiDataGrid-overlay": {
                backgroundColor: "transparent",
              },
              "& .MuiDataGrid-toolbarContainer .MuiButton-root": {
                textTransform: "none",
                color: "hsl(var(--foreground))",
              },
              "& .MuiDataGrid-toolbarContainer .MuiInputBase-root": {
                borderRadius: "10px",
                backgroundColor: "hsl(var(--background))",
              },
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};