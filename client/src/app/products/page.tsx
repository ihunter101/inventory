"use client"

import { useState } from "react"
import { useCreateProductMutation, useGetProductsQuery } from "../state/api"
import { PlusCircle, SearchIcon } from "lucide-react"
import Header from "../(components)/Header"
import Rating from "../(components)/Rating"
import { CreateProductDialog } from "../(components)/Products/CreateProductDialog"
import { toast } from "sonner" // <-- Ensure you installed 'sonner' library

interface ProductFormData {
  name: string
  price: number
  stockQuantity: number
  rating: number
  supplier?: string
  minimumQuantity?: number
  unit?: string
}

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: products, isLoading, isError } = useGetProductsQuery(searchTerm)
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation()

  const handleCreateProduct = async (productData: ProductFormData) => {
    const toastId = toast.loading("Creating product...")

    try {
      const result = await createProduct(productData).unwrap()
      toast.success("Product created successfully!", { id: toastId })
      setIsModalOpen(false)
    } catch (error) {
      console.error("Create product error:", error)
      toast.error("Failed to create product", { id: toastId })
    }
  }

  if (isLoading) {
    return <div className="py-8 text-center text-gray-500">Loading products...</div>
  }

  if (isError || !products) {
    return (
      <div className="text-center text-red-500 py-8">
        Failed to retrieve products. Please try again later.
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-12">
      {/* Search and Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex w-full max-w-md items-center border border-gray-300 rounded-md shadow-sm px-3 py-2 bg-white">
          <SearchIcon className="w-5 h-5 text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition text-white font-medium py-2 px-4 rounded shadow-sm"
        >
          <PlusCircle className="w-5 h-5" />
          Create Product
        </button>
      </div>

      {/* Products Header */}
      <div className="mb-4">
        <Header name="Products" />
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product.productId}
            className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition"
          >
            <div className="h-36 w-full bg-gray-100 rounded-md flex items-center justify-center text-gray-400 text-sm mb-3">
              img
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">
              {product.name}
            </h3>
            <p className="text-sm text-gray-700 font-medium">${product.price.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Quantity: {product.stockQuantity}</p>
            {product.rating && (
              <div className="mt-2">
                <Rating rating={product.rating} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Dialog */}
      <CreateProductDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateProduct}
        isCreating={isCreating} // <-- optional: you can pass loading state into modal
      />
    </div>
  )
}

export default Products
