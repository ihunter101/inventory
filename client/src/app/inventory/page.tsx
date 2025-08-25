"use client";

import Header from "../(components)/Header";
import { useGetProductsQuery } from "../state/api";
import { DataGrid, GridColDef } from "@mui/x-data-grid"

const columns: GridColDef[] = [
   { field: "productId", headerName: "ID", width: 90 },
   { field: "name", headerName: "Product Name", width: 200 },
   { field: "price", headerName: "Price", width: 110, type: "number", valueGetter: (value, row) => `$${row.price}` },
   { field: "rating", headerName: "Rating", width: 200, type: "number", valueGetter: (value, row) => row.rating ? row.rating : "N/A" },
   { field: "stockQuantity", headerName: "Stock Quantity", width: 150, type:"number" },

]

const Inventory = () => {
  const { data: products, isError, isLoading } = useGetProductsQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-400 border-t-transparent"></div>
        <span className="ml-3 text-gray-600 font-medium">Loading Inventory...</span>
      </div>
    );
  }

  if (isError || !products) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="text-red-500 text-lg font-semibold">Failed to load inventory</div>
        <p className="text-gray-500 mt-2">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
        {/* Header */}
        <Header name="Inventory" />

        <DataGrid 
            rows={products}
            columns={columns}
            getRowId={(row) => row.productId}
            checkboxSelection
            className="bg-white shadow rounded-lg border border-gray-200 mt-5 !text-gray-700"
        />
      
    </div>
  );
};

export default Inventory;
