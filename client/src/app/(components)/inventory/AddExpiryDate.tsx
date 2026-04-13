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
import { ChevronDown } from "lucide-react";

type MissingItem = {
  productId: string;
  name: string;
  unit?: string | null;
  expiryDate: string | null;
  inventory?: {
    stockQuantity: number;
    minQuantity: number;
    reorderPoint: number;
    lotNumber: string;
  } | null;
};

type RowDraft = {
  expiryDate: string;
  minQuantity: number;
  reorderPoint: number;
  lotNumber: string;
};

function toNumber(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function dateInputToISO(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00.000Z`).toISOString();
}

function isoToDateInput(iso: string): string {
  return iso.slice(0, 10);
}

type Props = {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function MissingExpiryTableCard({ isOpen, setIsOpen }: Props) {
  const [page, setPage] = React.useState(1)
  const limit = 15
  const { data, isLoading, isError } = useGetInventoryWithoutExpiryDateQuery({
    page, 
    limit,
  });
  const [updateMeta] = useUpdateInventoryMetaMutation();

  const items = (data?.data ?? []) as MissingItem[];
  const totalPages = data?.totalPages ?? 1;

  const [drafts, setDrafts] = React.useState<Record<string, RowDraft>>({});
  const [saving, setSaving] = React.useState<Record<string, boolean>>({});

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
            lotNumber: it.inventory?.lotNumber ?? "",
          };
        }
      }

      return next;
    });
  }, [items]);

  const setDraft = (productId: string, patch: Partial<RowDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] ?? {
          expiryDate: "",
          minQuantity: 0,
          reorderPoint: 0,
          lotNumber: "",
        }),
        ...patch,
      },
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
        lotNumber: d.lotNumber,
      }).unwrap();

      toast.success("Saved");
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Failed to save row.");
    } finally {
      setSaving((p) => ({ ...p, [item.productId]: false }));
    }
  };

  if (isLoading) {
    return (
      <Card className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold tracking-tight text-foreground">
            Missing Expiry Dates
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Add expiry date, min quantity, and reorder point for each lot. Save each row.
          </CardDescription>
        </CardHeader>

        <CardContent className="overflow-x-auto pt-0">
          <div className="rounded-2xl border border-border/60 bg-muted/30">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60">
                  <TableHead className="min-w-[260px] text-muted-foreground">Product</TableHead>
                  <TableHead className="min-w-[100px] text-muted-foreground">Stock</TableHead>
                  <TableHead className="min-w-[180px] text-muted-foreground">Lot Number</TableHead>
                  <TableHead className="min-w-[170px] text-muted-foreground">Expiry Date</TableHead>
                  <TableHead className="min-w-[100px] text-muted-foreground">Min Qty</TableHead>
                  <TableHead className="min-w-[100px] text-muted-foreground">Reorder Point</TableHead>
                  <TableHead className="min-w-[100px] text-right text-muted-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {items.map((it) => {
                  const d = drafts[it.productId] ?? {
                    expiryDate: "",
                    minQuantity: 0,
                    reorderPoint: 0,
                    lotNumber: "",
                  };

                  const isRowSaving = !!saving[it.productId];

                  return (
                    <TableRow key={it.productId} className="border-border/60">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{it.name}</span>
                          <span className="text-xs text-muted-foreground">{it.productId}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-foreground">
                        {it.inventory?.stockQuantity ?? 0}
                      </TableCell>

                      <TableCell>
                        <Input
                          type="text"
                          placeholder="Lot number"
                          value={d.lotNumber ?? ""}
                          onChange={(e) =>
                            setDraft(it.productId, { lotNumber: e.target.value })
                          }
                          className="border-border/60 bg-background"
                        />
                      </TableCell>

                      <TableCell>
                        <Input
                          type="date"
                          value={d.expiryDate}
                          onChange={(e) =>
                            setDraft(it.productId, { expiryDate: e.target.value })
                          }
                          className="border-border/60 bg-background"
                        />
                      </TableCell>

                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={d.minQuantity}
                          onChange={(e) =>
                            setDraft(it.productId, {
                              minQuantity: toNumber(e.target.value),
                            })
                          }
                          className="border-border/60 bg-background"
                        />
                      </TableCell>

                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={d.reorderPoint}
                          onChange={(e) =>
                            setDraft(it.productId, {
                              reorderPoint: toNumber(e.target.value),
                            })
                          }
                          className="border-border/60 bg-background"
                        />
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          onClick={() => saveRow(it)}
                          disabled={isRowSaving}
                          size="sm"
                          className="rounded-xl"
                        >
                          {isRowSaving ? "Saving..." : "Save"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold tracking-tight text-foreground">
            Missing Expiry Dates
          </CardTitle>
          <CardDescription className="text-destructive">
            Failed to load items.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!items.length) return null;

  return (
    <Card className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <CardHeader 
        className="pb-3"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold tracking-tight text-foreground">
            Missing Expiry Dates
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Add expiry date, min quantity, and reorder point. Save each row.
          </CardDescription>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`} />
        </div>
      </CardHeader>

    {isOpen && (
      <CardContent className="overflow-x-auto pt-0">
        <div className="rounded-2xl border border-border/60 bg-muted/30">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60">
                <TableHead className="min-w-[260px] text-muted-foreground">Product</TableHead>
                <TableHead className="min-w-[140px] text-muted-foreground">Stock</TableHead>
                <TableHead className="min-w-[180px] text-muted-foreground">Lot Number</TableHead>
                <TableHead className="min-w-[170px] text-muted-foreground">Expiry Date</TableHead>
                <TableHead className="min-w-[110px] text-muted-foreground">Min Qty</TableHead>
                <TableHead className="min-w-[110px] text-muted-foreground">Reorder Point</TableHead>
                <TableHead className="min-w-[120px] text-right text-muted-foreground">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {items.map((it) => {
                const d = drafts[it.productId] ?? {
                  expiryDate: "",
                  minQuantity: 0,
                  reorderPoint: 0,
                  lotNumber: "",
                };

                const stock = it.inventory?.stockQuantity ?? 0;
                const isRowSaving = !!saving[it.productId];

                return (
                  <TableRow key={it.productId} className="border-border/60">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{it.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {it.productId}
                          {it.unit ? ` • ${it.unit}` : ""}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-foreground">{stock}</TableCell>

                    <TableCell>
                      <Input
                        type="text"
                        placeholder="Lot number"
                        value={d.lotNumber ?? ""}
                        onChange={(e) =>
                          setDraft(it.productId, { lotNumber: e.target.value })
                        }
                        className="border-border/60 bg-background"
                      />
                    </TableCell>

                    <TableCell>
                      <Input
                        type="date"
                        value={d.expiryDate}
                        onChange={(e) =>
                          setDraft(it.productId, { expiryDate: e.target.value })
                        }
                        className="border-border/60 bg-background"
                      />
                    </TableCell>

                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={d.minQuantity}
                        onChange={(e) =>
                          setDraft(it.productId, {
                            minQuantity: toNumber(e.target.value),
                          })
                        }
                        className="border-border/60 bg-background"
                      />
                    </TableCell>

                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={d.reorderPoint}
                        onChange={(e) =>
                          setDraft(it.productId, {
                            reorderPoint: toNumber(e.target.value),
                          })
                        }
                        className="border-border/60 bg-background"
                      />
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        onClick={() => saveRow(it)}
                        disabled={isRowSaving}
                        className="rounded-xl"
                      >
                        {isRowSaving ? "Saving..." : "Save"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
         <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
              >
                Previous
              </Button>

              <span className="text-sm text-muted-foreground">
                Page {data?.page ?? 1} of {totalPages}
              </span>

              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </Button>
            </div>
      </CardContent>
    )}
    </Card>
  );
}