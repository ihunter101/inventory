"use client";

import { useAppDispatch, useAppSelector } from "@/app/redux";
import {
  selectStockSheetLines,
  selectStockSheetCount,
  selectSheetTotalQuantity,
  removeLine,
  increment,
  setQtyOnHandAtRequest,
  decrement,
  setQuantity,
  clear,
} from "@/app/state/stockSheetSlice";
import {
  Trash2,
  Plus,
  Minus,
  Clipboard,
  Download,
  Printer,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useCreateStockSheetMutation } from "@/app/state/api";
import { useEffect, useTransition } from "react";

export default function StockSheetPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const lines = useAppSelector(selectStockSheetLines);
  const totalCount = useAppSelector(selectStockSheetCount);
  const totalQuantity = useAppSelector(selectSheetTotalQuantity);
  const [isPending, startTransition] = useTransition();

  const [createStockRequest, { isLoading: isCreating }] =
    useCreateStockSheetMutation();

  useEffect(() => {
    console.log("Stock sheet page mounted");
  }, []);

  const handleSubmitStockSheet = async () => {
    const toastId = toast.loading("Submitting request...");

    try {
      const payload = {
        lines: lines.map((l) => ({
          productId: l.productId,
          requestedQty: l.requestedQty,
          qtyOnHandAtRequest: l.qtyOnHandAtRequest,
        })),
      };

      await createStockRequest(payload).unwrap();

      toast.success("Request submitted successfully", { id: toastId });

      dispatch(clear());

      startTransition(() => {
        router.push("/products");
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to submit request", { id: toastId });
    }
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all items from the stock sheet?")) {
      dispatch(clear());
      toast.success("Stock sheet cleared");
    }
  };

  const handleExportCSV = () => {
    const headers = ["Product Name", "Unit", "Qty on Hand", "Requested Quantity"];
    const rows = lines.map((line) => [
      line.name,
      line.unit || "N/A",
      line.qtyOnHandAtRequest.toString(),
      line.requestedQty.toString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-sheet-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Stock sheet exported");
  };

  const handlePrint = () => {
    window.print();
    toast.success("Opening print dialog");
  };

  const handleBrowseProducts = () => {
    startTransition(() => {
      router.push("/products");
    });
  };

  if (lines.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-auto w-full max-w-2xl px-4">
          <div className="rounded-2xl border border-border/60 bg-card p-12 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-primary/15 bg-primary/10">
              <Clipboard className="h-10 w-10 text-primary" />
            </div>

            <h2 className="mb-3 text-2xl font-bold text-foreground">
              Your Stock Sheet is Empty
            </h2>

            <p className="mx-auto mb-8 max-w-md text-muted-foreground">
              Add products from the Products page to create your stock request.
            </p>

            <Button
              onClick={handleBrowseProducts}
              disabled={isPending}
              size="lg"
              className="px-8"
            >
              {isPending ? "Loading..." : "Browse Products"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-12">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stock Sheet</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? "product" : "products"} • Total quantity:{" "}
            {totalQuantity}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>

          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>

          <Button variant="destructive" onClick={handleClearAll} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Clear All
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border/60 bg-muted/30">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Unit
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Qty On Hand
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Quantity for request
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {lines.map((line) => (
                <tr
                  key={line.productId}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted/40">
                        {line.imageUrl ? (
                          <img
                            src={line.imageUrl}
                            alt={line.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                            No img
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="font-medium text-foreground">{line.name}</p>
                        {line.category && (
                          <p className="text-xs text-muted-foreground">
                            {line.category}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium text-foreground">
                      {line.unit || "N/A"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center">
                      <input
                        type="number"
                        min="0"
                        value={line.qtyOnHandAtRequest}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          dispatch(
                            setQtyOnHandAtRequest({
                              productId: line.productId,
                              qtyOnHandAtRequest: val,
                            })
                          );
                        }}
                        className="w-24 rounded-md border border-border/60 bg-background px-3 py-2 text-center text-sm font-semibold text-foreground outline-none ring-0 transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() =>
                          dispatch(decrement({ productId: line.productId }))
                        }
                        className="rounded-md border border-border/60 bg-background px-3 py-2 transition-colors hover:bg-muted/40"
                        title="Decrease"
                      >
                        <Minus className="h-4 w-4 text-muted-foreground" />
                      </button>

                      <input
                        type="number"
                        min="1"
                        value={line.requestedQty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          dispatch(
                            setQuantity({
                              productId: line.productId,
                              requestedQty: val,
                            })
                          );
                        }}
                        className="w-20 rounded-md border border-border/60 bg-background px-3 py-2 text-center text-sm font-semibold text-foreground outline-none ring-0 transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />

                      <button
                        onClick={() =>
                          dispatch(increment({ productId: line.productId }))
                        }
                        className="rounded-md border border-border/60 bg-background px-3 py-2 transition-colors hover:bg-muted/40"
                        title="Increase"
                      >
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent
                        align="end"
                        className="w-48 border-border/60 bg-popover"
                      >
                        <DropdownMenuItem
                          onClick={() =>
                            dispatch(removeLine({ productId: line.productId }))
                          }
                          className="cursor-pointer text-red-600 focus:bg-red-500/10 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove from sheet
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border/60 bg-muted/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-primary">{totalCount}</span> products •{" "}
              <span className="font-semibold text-primary">{totalQuantity}</span> total
              units
            </div>

            <Button
              disabled={isCreating || isPending}
              onClick={handleSubmitStockSheet}
              className="gap-2"
            >
              <Clipboard className="h-4 w-4" />
              {isCreating || isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}