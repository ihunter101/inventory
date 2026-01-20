"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  useGetInventoryWithoutExpiryDateQuery,
  useUpdateInventoryMetaMutation,
} from "@/app/state/api";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type MissingItem = {
  productId: string;
  name: string;
  unit?: string | null;
  expiryDate: string | null;
  inventory?: {
    stockQuantity: number;
    minQuantity: number;
    reorderPoint: number;
  } | null;
};

type RowDraft = {
  expiryDate: string; // YYYY-MM-DD (from <input type="date" />) or ""
  minQuantity: number;
  reorderPoint: number;
};

function toNumber(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Converts YYYY-MM-DD -> ISO string at UTC midnight.
 * Avoids local timezone shifting the date.
 */
function dateInputToISO(dateStr: string): string {
  // dateStr like "2026-01-20"
  return new Date(`${dateStr}T00:00:00.000Z`).toISOString();
}

/**
 * Converts ISO date -> YYYY-MM-DD for <input type="date" />
 */
function isoToDateInput(iso: string): string {
  // keep only date portion
  return iso.slice(0, 10);
}

export function MissingExpiryTableCard() {
  const { data, isLoading, isError } = useGetInventoryWithoutExpiryDateQuery();
  const [updateMeta] = useUpdateInventoryMetaMutation();

  const items = (data ?? []) as MissingItem[];

  // drafts keyed by productId
  const [drafts, setDrafts] = React.useState<Record<string, RowDraft>>({});
  const [saving, setSaving] = React.useState<Record<string, boolean>>({});

  // initialize drafts when data loads
  React.useEffect(() => {
    if (!items.length) return;

    setDrafts((prev) => {
      const next = { ...prev };

      for (const it of items) {
        if (!next[it.productId]) {
          next[it.productId] = {
            expiryDate: it.expiryDate ? isoToDateInput(it.expiryDate) : "",
            minQuantity: it.inventory?.minQuantity ?? 0,
            reorderPoint: it.inventory?.reorderPoint ?? 0,
          };
        }
      }

      return next;
    });
  }, [items]);

  const setDraft = (productId: string, patch: Partial<RowDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [productId]: { ...(prev[productId] ?? { expiryDate: "", minQuantity: 0, reorderPoint: 0 }), ...patch },
    }));
  };

  const saveRow = async (item: MissingItem) => {
    const d = drafts[item.productId];
    if (!d) return;

    if (d.minQuantity < 0 || d.reorderPoint < 0) {
      toast.error("Min Quantity and Reorder Point cannot be negative.");
      return;
    }

    if (!d.expiryDate) {
      toast.error("Please set an expiry date before saving.");
      return;
    }

    try {
      setSaving((p) => ({ ...p, [item.productId]: true }));

      await updateMeta({
        productId: item.productId,
        expiryDate: dateInputToISO(d.expiryDate),
        minQuantity: d.minQuantity,
        reorderPoint: d.reorderPoint,
      }).unwrap();

      toast.success("Saved");
      // After save, the item should drop out of this list (because expiryDate is no longer null)
      // due to invalidatesTags -> refetch.
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Failed to save row.");
    } finally {
      setSaving((p) => ({ ...p, [item.productId]: false }));
    }
  };

  if (isLoading) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Missing Expiry Dates</CardTitle>
          <CardDescription>Loading…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Missing Expiry Dates</CardTitle>
          <CardDescription>Failed to load items.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!items.length) return null;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base">Missing Expiry Dates</CardTitle>
        <CardDescription>
          Add expiry date, min quantity, and reorder point. Save each row.
        </CardDescription>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[260px]">Product</TableHead>
              <TableHead className="min-w-[140px]">Stock</TableHead>
              <TableHead className="min-w-[170px]">Expiry Date</TableHead>
              <TableHead className="min-w-[160px]">Min Qty</TableHead>
              <TableHead className="min-w-[160px]">Reorder Point</TableHead>
              <TableHead className="min-w-[120px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.map((it) => {
              const d = drafts[it.productId] ?? {
                expiryDate: "",
                minQuantity: 0,
                reorderPoint: 0,
              };

              const stock = it.inventory?.stockQuantity ?? 0;
              const isRowSaving = !!saving[it.productId];

              return (
                <TableRow key={it.productId}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{it.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {it.productId}{it.unit ? ` • ${it.unit}` : ""}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>{stock}</TableCell>

                  <TableCell>
                    <Input
                      type="date"
                      value={d.expiryDate}
                      onChange={(e) => setDraft(it.productId, { expiryDate: e.target.value })}
                    />
                  </TableCell>

                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      value={d.minQuantity}
                      onChange={(e) => setDraft(it.productId, { minQuantity: toNumber(e.target.value) })}
                    />
                  </TableCell>

                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      value={d.reorderPoint}
                      onChange={(e) => setDraft(it.productId, { reorderPoint: toNumber(e.target.value) })}
                    />
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      onClick={() => saveRow(it)}
                      disabled={isRowSaving}
                    >
                      {isRowSaving ? "Saving..." : "Save"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
