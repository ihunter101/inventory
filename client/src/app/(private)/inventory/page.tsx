"use client";

import * as React from "react";
import { Container, CircularProgress } from "@mui/material";

import {
  useGetInventoryQuery,
  useAdjustInventoryMutation,
  useSetInventoryMutation,
} from "../../state/api";

import type { Status } from "../../utils/stock";
import {InventoryHeader} from "@/app/(components)/inventory/InventoryHeader";
import {InventoryFilters} from "@/app/(components)/inventory/InventoryFilters";
import {InventoryTable} from "@/app/(components)/inventory/InventoryTable";
import {StocktakeDialog} from "@/app/(components)/inventory/StockTakeDialogue";
import {
  Category,
  InventoryRow,
  deriveStatus,
} from "@/app/(components)/inventory/InventoryTypes";

export default function InventoryPage() {
  const { data = [], isLoading, isError, error, refetch } = useGetInventoryQuery();
  const [adjustInventory, { isLoading: adjusting }] = useAdjustInventoryMutation();
  const [setInventory, { isLoading: setting }] = useSetInventoryMutation();

  // filters
  const [status, setStatus] = React.useState<"all" | Status>("all");
  const [category, setCategory] = React.useState<"all" | Category>("all");

  // stocktake dialog state
  const [stocktakeOpen, setStocktakeOpen] = React.useState(false);
  const [stocktakeItem, setStocktakeItem] = React.useState<{
    productId: string;
    name: string;
    unit?: string;
    current: number;
  } | null>(null);

  const rows = React.useMemo<InventoryRow[]>(() => data as any, [data]);

  const filteredRows = React.useMemo(
    () =>
      rows.filter((r) => {
        const s = deriveStatus(r);
        const okStatus = status === "all" ? true : s === status;
        const okCategory =
          category === "all" ? true : (r.category ?? "other") === category;
        return okStatus && okCategory;
      }),
    [rows, status, category]
  );

  // quick +/- adjust
  const handleQuickAdjust = async (row: InventoryRow, delta: number, reason?: string) => {
  try {
    await adjustInventory({ productId: row.productId, delta, reason }).unwrap()
    .then((payload) => console.log("fullfilled", payload));
  } catch (e) {
    console.error("Adjust inventory failed:", e);
  }
};


  // stocktake open/close + save
  const handleOpenStocktake = (row: InventoryRow) => {
    setStocktakeItem({
      productId: row.productId,
      name: row.name,
      unit: row.unit,
      current: row.stockQuantity,
    });
    setStocktakeOpen(true);
  };

  const handleCloseStocktake = () => {
    setStocktakeOpen(false);
    setStocktakeItem(null);
  };

  const handleSaveStocktake = async (args: {
    productId: string;
    quantity: number;
    countedAt: string;
  }) => {
    await setInventory({
      productId: args.productId,
      stockQuantity: args.quantity,
      lastCounted: args.countedAt,
    });
    handleCloseStocktake();
  };

  const busy = isLoading || adjusting || setting;

  // initial load skeleton (optional)
  if (isLoading && !data.length) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <InventoryHeader
        onAddItem={() => {
          /* hook into your add flow */
        }}
        onExport={() => {
          /* hook into your export flow */
        }}
      />

      <InventoryFilters
        status={status}
        category={category}
        onStatusChange={setStatus}
        onCategoryChange={setCategory}
        isBusy={busy}
      />

      <InventoryTable
        rows={filteredRows}
        isError={isError}
        error={error}
        onRefresh={refetch}
        adjusting={adjusting}
        setting={setting}
        onQuickAdjust={handleQuickAdjust}
        onOpenStocktake={handleOpenStocktake}
      />

      <StocktakeDialog
        open={stocktakeOpen}
        item={stocktakeItem}
        onClose={handleCloseStocktake}
        onSave={handleSaveStocktake}
        isSaving={setting}
      />
    </Container>
  );
}
