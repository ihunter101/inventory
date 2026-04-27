"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { SupplierWithPurchaseOrders } from "@/app/state/api";

export const supplierColumns: ColumnDef<SupplierWithPurchaseOrders>[] = [
  {
    accessorKey: "name",
    header: "Supplier",
    cell: ({ row }) => {
      const supplier = row.original;

      return (
        <div className="space-y-1">
          <Link
            href={`/suppliers/${supplier.supplierId}`}
            className="font-medium text-primary hover:underline"
          >
            {supplier.name}
          </Link>

          <p className="text-xs text-muted-foreground">
            ID: {supplier.supplierId}
          </p>
        </div>
      );
    },
  },

  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const email = row.original.email;

      return (
        <span className="text-sm text-muted-foreground">
          {email || "No email"}
        </span>
      );
    },
  },

  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => {
      const phone = row.original.phone;

      return (
        <span className="text-sm text-muted-foreground">
          {phone || "No phone"}
        </span>
      );
    },
  },

  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => {
      const address = row.original.address;

      return (
        <span className="text-sm text-muted-foreground">
          {address || "No address"}
        </span>
      );
    },
  },

  {
    id: "purchaseOrders",
    header: "Purchase Orders",
    cell: ({ row }) => {
      const purchaseOrders = row.original.purchaseOrders ?? [];

      return (
        <div className="text-sm">
          <p className="font-medium">{purchaseOrders.length}</p>
          <p className="text-xs text-muted-foreground">
            total orders
          </p>
        </div>
      );
    },
  },

  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const createdAt = row.original.createdAt;

      return (
        <span className="text-sm text-muted-foreground">
          {new Date(createdAt).toLocaleDateString()}
        </span>
      );
    },
  },

  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const supplier = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open supplier actions</span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href={`/suppliers/${supplier.supplierId}`}>
                <Eye className="mr-2 h-4 w-4" />
                View supplier details
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href={`/suppliers/${supplier.supplierId}`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit supplier
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];