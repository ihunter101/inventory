"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCreateProductMutation,
  useGetProductsQuery,
} from "../../state/api";
import { PlusCircle, SearchIcon } from "lucide-react";
import Header from "../../(components)/Header";
import Rating from "../../(components)/Rating";
import { CreateProductDialog } from "../../(components)/Products/CreateProductDialog";
import { toast } from "sonner";
import ProductsPagination from "@/app/(components)/Products/ProductsPagination";

interface ProductFormData {
  name: string;
  price: number;
  stockQuantity: number;
  rating: number;
  supplier?: string;
  minQuantity?: number;
  unit?: string;
  category?: string;
  expiryDate?: string;
  imageUrl?: string;
}

const Products = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ Read filters & page from the URL
  const page = Number(searchParams.get("page") ?? "1");
  const search = searchParams.get("search") ?? "";
  const departmentInUrl = searchParams.get("department"); // can be null or value

  // department for UI select
  const departmentSelectValue = departmentInUrl ?? "all";

  // department for API (undefined means "no filter")
  const departmentForApi =
    departmentInUrl && departmentInUrl !== "all"
      ? departmentInUrl
      : undefined;

  // ✅ Helper to update URL query string
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

  // ✅ call API with page + filters from URL
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
      // optional: reset to first page
      // updateQuery({ page: 1 });
    } catch (error) {
      console.error("Create product error:", error);
      toast.error("Failed to create product", { id: toastId });
    }
  };

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

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-12">
      {/* Top bar: title + search + filter + button */}
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
                // reset to first page whenever you change search
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
      {products.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          No products found for this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.productId}
              className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="h-36 w-full bg-gray-100 rounded-md flex items-center justify-center text-gray-400 text-sm mb-3 overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span>Image</span>
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">
                {product.name}
              </h3>
              <p className="text-sm font-medium text-gray-900">
                ${product.price?.toFixed?.(2) ?? "0.00"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Quantity: {product.stockQuantity}
              </p>
              {product.rating && (
                <div className="mt-2">
                  <Rating rating={product.rating} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination bar */}
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
