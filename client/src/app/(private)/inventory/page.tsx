"use client";

import * as React from "react";
import { Container, CircularProgress } from "@mui/material";

import {
  useGetInventoryQuery,
  useAdjustInventoryMutation,
  useSetInventoryMutation,
} from "../../state/api";

import type { Status } from "../../utils/stock";
import { InventoryHeader } from "@/app/(components)/inventory/InventoryHeader";
import { InventoryFilters } from "@/app/(components)/inventory/InventoryFilters";
import { InventoryTable } from "@/app/(components)/inventory/InventoryTable";
import { StocktakeDialog } from "@/app/(components)/inventory/StockTakeDialogue";
import {
  InventoryRow,
  deriveStatus,
} from "@/app/(components)/inventory/InventoryTypes";
import { InventoryItem as PdfItem } from "@/app/pdf/InventoryDocument";
import type { Category } from "@/app/(components)/Products/UpdateProductDialog";
import { MissingExpiryTableCard } from "@/app/(components)/inventory/AddExpiryDate";
import { Input } from "@/components/ui/input";

export default function InventoryPage() {

  const [search, setSearch] = React.useState("");
  const[debounceSearch, setDebouncedSearch] = React.useState("");

    //debounce for search
  React.useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(search.trim());
  }, 400);

  return () => clearTimeout(timer);
}, [search]);


  const { data = [], isLoading, isError, error, refetch } = useGetInventoryQuery(debounceSearch || undefined);
  const [adjustInventory, { isLoading: adjusting }] = useAdjustInventoryMutation();
  const [setInventory, { isLoading: setting }] = useSetInventoryMutation();

  const [status, setStatus] = React.useState<"all" | Status>("all");
  const [category, setCategory] = React.useState<"all" | Category>("all");

  
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

  const pdfItems: PdfItem[] = React.useMemo(
    () =>
      filteredRows.map((row) => ({
        id: row.productId,
        name: row.name,
        category: row.category ?? "Other",
        quantity: row.stockQuantity,
        unit: row.unit ?? "pcs",
        expiryDate: row.expiryDate ?? undefined,
        status: deriveStatus(row) as string,
      })),
    [filteredRows]
  );

  const handleQuickAdjust = async (
    row: InventoryRow,
    delta: number,
    reason?: string
  ) => {
    try {
      await adjustInventory({ productId: row.productId, delta, reason })
        .unwrap()
        .then((payload) => console.log("fulfilled", payload));
    } catch (e) {
      console.error("Adjust inventory failed:", e);
    }
  };

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
  try {
    await setInventory({
      productId: args.productId,
      stockQuantity: args.quantity,
      lastCounted: args.countedAt,
    }).unwrap();

    handleCloseStocktake();
  } catch (e) {
    console.error("Set inventory failed:", e);
  }
};

  const busy = isLoading || adjusting || setting;

  if (isLoading && !data.length) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <CircularProgress size={28} />
            <p className="text-sm text-muted-foreground">Loading inventory...</p>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, pb: 8 }}>
      <div className="flex flex-col gap-6">
        <InventoryHeader onAddItem={() => {}} pdfItems={pdfItems} />

        <MissingExpiryTableCard />

        
       

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
          search={search}
          onSearchChange={setSearch}
        />

        <StocktakeDialog
          open={stocktakeOpen}
          item={stocktakeItem}
          onClose={handleCloseStocktake}
          onSave={handleSaveStocktake}
          isSaving={setting}
        />
      </div>
    </Container>
  );
}