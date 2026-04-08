"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useGetProductsQuery,
  useUpdateProductMutation,
} from "../../state/api";
import { PlusCircle, SearchIcon, Star } from "lucide-react";
import Header from "../../(components)/Header";
import { UpdateProductDialog } from "../../(components)/Products/UpdateProductDialog"; // keep your import path for now
import { toast } from "sonner";
import ProductsPagination from "@/app/(components)/Products/ProductsPagination";
import {
  addLine,
  removeLine,
  increment,
  decrement,
  selectStockSheetLines
} from "@/app/state/stockSheetSlice";
import { ClipboardPlus, Minus, Plus, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Protect } from "@/app/(components)/auth/Protect";
import { Can } from "@/app/(components)/auth/Can";

interface ProductFormData {
  // IMPORTANT: for update, we need a productId coming from the dialog
  productId: string;

  name: string;
  stockQuantity: number;
  rating: number;
  supplier?: string | null;
  minQuantity?: number | null;
  unit?: string | null;
  category?: string | null;
  expiryDate?: string | null;
  imageUrl?: string | null;
  Department?: string | null;
  sku?: string | null;
}

const Products = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? "1");
  const search = searchParams.get("search") ?? "";
  const departmentInUrl = searchParams.get("department");

  const departmentSelectValue = departmentInUrl ?? "all";
  const departmentForApi =
    departmentInUrl && departmentInUrl !== "all"
      ? departmentInUrl
      : undefined;

  const updateQuery = (updates: {
    page?: number;
    search?: string;
    department?: string | null;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.page !== undefined) {
      params.set("page", String(updates.page));
    }

    if (updates.search !== undefined) {
      if (updates.search) params.set("search", updates.search);
      else params.delete("search");
    }

    if (updates.department !== undefined) {
      if (updates.department && updates.department !== "all") {
        params.set("department", updates.department);
      } else {
        params.delete("department");
      }
    }

    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, isError } = useGetProductsQuery({
    page,
    search: search || undefined,
    department: departmentForApi,
  });

  const products = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;
  const pageSize = data?.pageSize ?? 20;

  const [updateProduct, { isLoading: isUpdating }] =
    useUpdateProductMutation();

  const handleUpdateProduct = async (productData: ProductFormData) => {
    const toastId = toast.loading("Updating product...");

    try {
      // Adjust this payload to match your backend update controller fields
      await updateProduct({
        productId: productData.productId,
        body: {
          name: productData.name,
          stockQuantity: productData.stockQuantity,
          rating: productData.rating,
          supplier: productData.supplier ?? null,
          minQuantity: productData.minQuantity ?? null,
          unit: productData.unit ?? null,
          category: productData.category ?? null,
          expiryDate: productData.expiryDate ? new Date(productData.expiryDate).toISOString() : null,
          imageUrl: productData.imageUrl ?? null,
          Department: productData.Department ?? null,
          sku: productData.sku ?? null,
        },
      }).unwrap();

      toast.success("Product updated successfully!", { id: toastId });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Update product error:", error);
      toast.error("Failed to update product", { id: toastId });
    }
  };

  const dispatch = useAppDispatch();
  const stockLines = useAppSelector(selectStockSheetLines);

  if (isLoading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading products...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-8 text-center text-destructive">
        Failed to retrieve products. Please try again later.
      </div>
    );
  }

  const startIndex =
    products.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = (page - 1) * pageSize + products.length;

  const lineById = new Map(stockLines.map((line) => [line.productId, line]));

  // Helper to render stars
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-muted text-muted"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-12">
      {/* Top bar */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Header name="Products" />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search box */}
          <div className="flex w-full items-center rounded-md border border-border/60 bg-card px-3 py-2 shadow-sm sm:w-64">
            <SearchIcon className="mr-2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              value={search}
              onChange={(e) => {
                updateQuery({ search: e.target.value, page: 1 });
              }}
            />
          </div>

          {/* Department Filter */}
          <select
            value={departmentSelectValue}
            onChange={(e) => {
              const value = e.target.value;
              updateQuery({
                department: value === "all" ? null : value,
                page: 1,
              });
            }}
            className="rounded-md border border-border/60 bg-card px-3 py-2 text-sm text-foreground"
          >
            <option value="all">All Departments</option>
            <option value="Administration">Admin</option>
            <option value="Specimen">Specimen</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Haematology">Haematology</option>
            <option value="Offlines">Offlines</option>
            <option value="Cytology">Cytology</option>
          </select>

          {/* Button (kept as-is; you can rename label later) */}
          <Can>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              <PlusCircle className="h-5 w-5" />
              Update Product
            </button>
          </Can>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => {
          const line = lineById.get(product.productId);

          return (
            <div
              key={product.productId}
              className="group relative rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all duration-300 hover:border-border hover:shadow-xl"
            >
              {/* Product Image */}
              <div className="relative mb-4 flex h-40 w-full items-center justify-center overflow-hidden rounded-xl bg-muted/30 text-sm text-muted-foreground">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <span className="text-xs">No image</span>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-2">
                <h3 className="truncate text-base font-semibold text-foreground">
                  {product.name}
                </h3>

                {/* Stock Quantity */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Stock:</span>
                  <span className="text-sm font-medium text-foreground">
                    {product.unit || "units"}
                  </span>
                </div>

                {/* Rating - Horizontal */}
                {product.rating && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Rating:</span>
                    {renderStars(product.rating)}
                  </div>
                )}

                {/* Category Badge */}
                {product.category && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {product.category}
                    </Badge>
                  </div>
                )}

                {/* Department Badge */}
                {product.department && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {product.department}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Stock Sheet Controls - unchanged */}
              <div className="mt-4">
                {!line ? (
                  <Button
                    onClick={() =>
                      dispatch(
                        addLine({
                          productId: product.productId,
                          name: product.name,
                          unit: product.unit ?? null,
                          imageUrl: product.imageUrl ?? null,
                          requestedQty: 1,
                        })
                      )
                    }
                    className="w-full"
                  >
                    <ClipboardPlus className="mr-2 h-4 w-4" />
                    Add to Stock Sheet
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/10 p-2">
                    <Button
                      onClick={() => dispatch(decrement({ productId: product.productId }))}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-primary/10"
                    >
                      <Minus className="h-4 w-4 text-primary" />
                    </Button>

                    <div className="flex-1 text-center">
                      <span className="text-sm font-semibold text-foreground">
                        {line.requestedQty}
                      </span>
                    </div>

                    <Button
                      onClick={() => dispatch(increment({ productId: product.productId }))}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-primary/10"
                    >
                      <Plus className="h-4 w-4 text-primary" />
                    </Button>

                    <Button
                      onClick={() => dispatch(removeLine({ productId: product.productId }))}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing{" "}
          {products.length === 0 ? "0–0" : `${startIndex}–${endIndex}`} of{" "}
          {totalItems} products
        </span>

        <ProductsPagination
          page={page}
          totalPages={totalPages}
          onPageChange={(nextPage) => updateQuery({ page: nextPage })}
        />
      </div>

      {/* Modal Dialog */}
      <UpdateProductDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleUpdateProduct}     // ✅ fixed
        isCreating={isUpdating}            // ✅ update loading
      />
    </div>
  );
};

export default Products;