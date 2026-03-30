"use client";

import * as React from "react";
import { Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComboSelect } from "./ComboSelect";
import type { ComboOption } from "@/app/(components)/purchase-order/utils/po";

export type SupplierLite = {
  supplierId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
};

export type SupplierDraft = {
  mode: "existing" | "new";
  supplierId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
};

type Props = {
  suppliers: SupplierLite[];
  supplierOptions: ComboOption[];
  value: SupplierDraft;
  onChange: (next: SupplierDraft) => void;
  disabled?: boolean;
};

export function SupplierSection({
  suppliers,
  supplierOptions,
  value,
  onChange,
  disabled = false,
}: Props) {
  const isExisting = value.mode === "existing" && !!value.supplierId;
  const lockFields = disabled || isExisting;

  return (
    <div className="mb-8 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start gap-3 sm:items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10">
          <Building2 className="h-5 w-5 text-primary" />
        </div>

        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-foreground sm:text-xl">
            Supplier Information
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Select an existing supplier or enter details for a new one.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="lg:col-span-2 min-w-0">
          <Label className="text-sm font-medium text-foreground">
            Select Existing or Create New Supplier
          </Label>

          <div className="mt-2 min-w-0">
            <ComboSelect
              value={isExisting ? value.supplierId : ""}
              onChange={(supplierId) => {
                if (!supplierId) {
                  onChange({
                    mode: "new",
                    supplierId: "",
                    name: "",
                    email: "",
                    phone: "",
                    address: "",
                  });
                } else {
                  const s = suppliers.find((x) => x.supplierId === supplierId);
                  onChange({
                    mode: "existing",
                    supplierId,
                    name: s?.name ?? "",
                    email: s?.email ?? "",
                    phone: s?.phone ?? "",
                    address: s?.address ?? "",
                  });
                }
              }}
              options={supplierOptions}
              placeholder="Select existing supplier or type new name"
              allowCreate
              onCreate={async (label) => {
                onChange({
                  mode: "new",
                  supplierId: "",
                  name: label,
                  email: "",
                  phone: "",
                  address: "",
                });
                return { value: "", label };
              }}
            />
          </div>

          {value.mode === "new" && (
            <p className="mt-2 text-sm text-primary">
              New supplier — fill in details below
            </p>
          )}
        </div>

        <div className="min-w-0">
          <Label className="text-sm font-medium text-foreground">
            Supplier Name *
          </Label>
          <Input
            className="mt-2 h-11 text-base"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="Enter supplier name"
            disabled={lockFields}
          />
        </div>

        <div className="min-w-0">
          <Label className="text-sm font-medium text-foreground">
            Email Address
          </Label>
          <Input
            type="email"
            className="mt-2 h-11 text-base"
            value={value.email}
            onChange={(e) => onChange({ ...value, email: e.target.value })}
            placeholder="supplier@example.com"
            disabled={lockFields}
          />
        </div>

        <div className="min-w-0">
          <Label className="text-sm font-medium text-foreground">
            Phone Number
          </Label>
          <Input
            type="tel"
            className="mt-2 h-11 text-base"
            value={value.phone}
            onChange={(e) => onChange({ ...value, phone: e.target.value })}
            placeholder="+1 (555) 000-0000"
            disabled={lockFields}
          />
        </div>

        <div className="min-w-0">
          <Label className="text-sm font-medium text-foreground">
            Address
          </Label>
          <Input
            className="mt-2 h-11 text-base"
            value={value.address}
            onChange={(e) => onChange({ ...value, address: e.target.value })}
            placeholder="123 Main St, City, State ZIP"
            disabled={lockFields}
          />
        </div>
      </div>
    </div>
  );
}