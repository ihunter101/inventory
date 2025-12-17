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
  supplierId: string; // only used when mode === "existing"
  name: string;
  email: string;
  phone: string;
  address: string;
};

/**
 * const [supplier, setSupplier ] = React.useState(
 * mode === "edit" && initial.supplier.mode ==="existing" 
 * ? initial.supplier 
 * : { mode: "new", name: "", email: "", phone: "", address: ""}
 * )
 */

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
    <div className="mb-8 rounded-2xl border-2 border-slate-200 bg-slate-50/50 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Building2 className="h-5 w-5 text-slate-600" />
        <h3 className="text-xl font-semibold text-slate-900">
          Supplier Information
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label className="text-sm font-medium text-slate-700">
            Select Existing or Create New Supplier
          </Label>

          <ComboSelect
            className="mt-2"
            value={isExisting ? value.supplierId : ""}
            onChange={(supplierId) => {
              if (!supplierId) {
                //  Clearing selection - switch to new mode
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
                // Autopopulate from selected supplier
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
              // ✅ Switch to “new supplier” mode (inputs editable)
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
            //disabled={disabled}
          />

          {value.mode === "new" && (
            <p className="mt-1.5 text-sm text-blue-600">
              New supplier — fill in details below
            </p>
          )}
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700">
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

        <div>
          <Label className="text-sm font-medium text-slate-700">
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

        <div>
          <Label className="text-sm font-medium text-slate-700">
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

        <div>
          <Label className="text-sm font-medium text-slate-700">Address</Label>
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
