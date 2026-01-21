"use client";

import { useAppDispatch, useAppSelector } from "@/app/redux";
import {
  selectStockSheetLines,
  selectStockSheetCount,
  selectSheetTotalQuantity,
  removeLine,
  increment,
  decrement,
  setQuantity,
  clear,
} from "@/app/state/stockSheetSlice";
import { Trash2, Plus, Minus, Clipboard, Download, Printer, MoreVertical } from "lucide-react";
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

  const [createStockRequest, {isLoading: isCreating}] = useCreateStockSheetMutation();

  useEffect(() => {
    console.log("Stock sheet page mounted");
  }, []);

  const handleSubmitStockSheet = async () => {
    const toastId = toast.loading("Submitting request...");
    
    try {
      const payload = {
        lines: lines.map((l) => ({ productId: l.productId, requestedQty: l.requestedQty }))
      };

      await createStockRequest(payload).unwrap();

      toast.success("Request submitted successfully", { id: toastId });
      
      dispatch(clear());
      
      // Use startTransition to make navigation non-blocking
      startTransition(() => {
        router.push('/products');
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
    const headers = ["Product Name", "Unit", "Requested Quantity"];
    const rows = lines.map((line) => [
      line.name,
      line.unit || "N/A",
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="mx-auto w-full max-w-2xl px-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-50 to-green-50">
              <Clipboard className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Your Stock Sheet is Empty
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Add products from the Products page to create your stock request.
            </p>
            <Button
              onClick={handleBrowseProducts}
              disabled={isPending}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 px-8"
              size="lg"
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
      {/* Header Section */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Sheet</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalCount} {totalCount === 1 ? "product" : "products"} • Total quantity: {totalQuantity}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            variant="destructive"
            onClick={handleClearAll}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Stock Sheet Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lines.map((line) => (
                <tr
                  key={line.productId}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Product Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-gray-100 overflow-hidden">
                        {line.imageUrl ? (
                          <img
                            src={line.imageUrl}
                            alt={line.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">
                            No img
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{line.name}</p>
                        {line.category && (
                          <p className="text-xs text-gray-500">{line.category}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Unit */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      {line.unit || "N/A"}
                    </span>
                  </td>

                  {/* Quantity Controls */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() =>
                          dispatch(decrement({ productId: line.productId }))
                        }
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 hover:bg-gray-50 transition-colors"
                        title="Decrease"
                      >
                        <Minus className="h-4 w-4 text-gray-600" />
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
                        className="w-20 rounded-md border border-gray-300 bg-white px-3 py-2 text-center text-sm font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />

                      <button
                        onClick={() =>
                          dispatch(increment({ productId: line.productId }))
                        }
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 hover:bg-gray-50 transition-colors"
                        title="Increase"
                      >
                        <Plus className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  </td>

                  {/* Actions Dropdown */}
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white">
                        <DropdownMenuItem
                          onClick={() =>
                            dispatch(removeLine({ productId: line.productId }))
                          }
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
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

        {/* Footer Summary */}
        <div className="border-t bg-gradient-to-r from-emerald-50/50 to-green-50/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              <span className="font-semibold text-emerald-700">{totalCount}</span> products •{" "}
              <span className="font-semibold text-emerald-700">{totalQuantity}</span> total units
            </div>
            <Button 
              disabled={isCreating || isPending}
              onClick={handleSubmitStockSheet}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 gap-2"
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