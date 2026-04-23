"use client";

import Link from "next/link";
import { useGetSuppliersQuery } from "@/app/state/api";

export default function SuppliersPage() {
  const { data: suppliers, isLoading, isError } = useGetSuppliersQuery();

  if (isLoading) {
    return <div className="p-6">Loading suppliers...</div>;
  }

  if (isError) {
    return <div className="p-6 text-red-500">Failed to load suppliers.</div>;
  }

  if (!suppliers || suppliers.length === 0) {
    return <div className="p-6">No suppliers found.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <p className="text-sm text-muted-foreground">
          View all suppliers and open their analytics.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Address</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.supplierId} className="border-t">
                <td className="p-3 font-medium">{supplier.name}</td>
                <td className="p-3">{supplier.email || "-"}</td>
                <td className="p-3">{supplier.phone || "-"}</td>
                {/* //<td className="p-3">{supplier.address || "-"}</td> */}
                <td className="p-3">
                  <Link
                    href={`/suppliers/${supplier.supplierId}`}
                    className="text-blue-600 hover:underline"
                  >
                    View analytics
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}