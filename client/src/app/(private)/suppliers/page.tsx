"use client";

import { useState } from "react";
import { supplierColumns } from "../../(components)/supplier/SupplierHeader";
import { DataTable } from "@/components/ui/data-table"
import { useGetSuppliersQuery } from "@/app/state/api";

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useGetSuppliersQuery({
    search,
    page,
    limit: 10,
  });

  const suppliers = data?.suppliers ?? [];

  if (isLoading) return <p>Loading suppliers...</p>;
  if (isError) return <p>Failed to load suppliers.</p>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <p className="text-muted-foreground">
          Manage supplier records and purchase activity.
        </p>
      </div>

      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        placeholder="Search suppliers..."
        className="w-full rounded-md border px-3 py-2"
      />

      <DataTable
        columns={supplierColumns}
        data={suppliers}
      />
    </div>
  );
}