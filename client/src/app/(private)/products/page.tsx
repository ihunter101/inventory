"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCreateProductMutation,
  useGetProductsQuery,
} from "../../state/api";
import { PlusCircle, SearchIcon, Star } from "lucide-react";
import Header from "../../(components)/Header";
import { CreateProductDialog } from "../../(components)/Products/CreateProductDialog";
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

interface ProductFormData {
  name: string;
  stockQuantity: number;
  rating: number;
  supplier?: string;
  minQuantity?: number;
  unit?: string;
  category?: string;
  expiryDate?: string;
  imageUrl?: string;
  Department?: string;
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

  const [createProduct, { isLoading: isCreating }] =
    useCreateProductMutation();

  const handleCreateProduct = async (productData: ProductFormData) => {
    const toastId = toast.loading("Creating product...");

    try {
      await createProduct(productData).unwrap();
      toast.success("Product created successfully!", { id: toastId });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Create product error:", error);
      toast.error("Failed to create product", { id: toastId });
    }
  };

  const dispatch = useAppDispatch();
  const stockLines = useAppSelector(selectStockSheetLines);

  if (isLoading) {
    return (
      <div className="py-8 text-center text-gray-500">
        Loading products...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-red-500 py-8">
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
                : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-12">
      {/* Top bar */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Header name="Products" />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search box */}
          <div className="flex w-full sm:w-64 items-center border border-gray-300 rounded-md shadow-sm px-3 py-2 bg-white">
            <SearchIcon className="w-5 h-5 text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full outline-none text-sm"
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
            className="border bg-white rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Departments</option>
            <option value="Administration">Admin</option>
            <option value="Specimen">Specimen</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Haematology">Haematology</option>
            <option value="Offlines">Offlines</option>
            <option value="Cytology">Cytology</option>
          </select>

          {/* Create button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition text-white font-medium py-2 px-4 rounded shadow-sm"
          >
            <PlusCircle className="w-5 h-5" />
            Create Product
          </button>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => {
          const line = lineById.get(product.productId);

          return (
            <div
              key={product.productId}
              className="group relative rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300"
            >
              {/* Product Image */}
              <div className="relative h-40 w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm mb-4 overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <span className="text-xs">No image</span>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {product.name}
                </h3>

                {/* Stock Quantity */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Stock:</span>
                  <span className="text-sm font-medium text-gray-700">
                    {product.stockQuantity} {product.unit || "units"}
                  </span>
                </div>

                {/* Rating - Horizontal */}
                {product.rating && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Rating:</span>
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

              {/* Stock Sheet Controls - Modern Glassmorphism */}
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
                    className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 backdrop-blur-sm border border-emerald-400/20"
                  >
                    <ClipboardPlus className="mr-2 h-4 w-4" />
                    Add to Stock Sheet
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/50 backdrop-blur-sm">
                    <Button
                      onClick={() => dispatch(decrement({ productId: product.productId }))}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <Minus className="h-4 w-4 text-emerald-700" />
                    </Button>

                    <div className="flex-1 text-center">
                      <span className="text-sm font-semibold text-emerald-900">
                        {line.requestedQty}
                      </span>
                    </div>

                    <Button
                      onClick={() => dispatch(increment({ productId: product.productId }))}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <Plus className="h-4 w-4 text-emerald-700" />
                    </Button>

                    <Button
                      onClick={() => dispatch(removeLine({ productId: product.productId }))}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500">
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
      <CreateProductDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateProduct}
        isCreating={isCreating}
      />
    </div>
  );
};

export default Products;