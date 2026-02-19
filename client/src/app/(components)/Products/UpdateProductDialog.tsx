"use client";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { UploadButton } from "@/utils/uploadthing";
import "@uploadthing/react/styles.css";

import {
  useGetProductsQuery,
  useGetProductByIdQuery,
} from "@/app/state/api";

export const CATEGORY_OPTIONS = ["Collection", "Equipment", "Reagent", "Safety", "Other"] as const;
const RATING_OPTIONS = [0, 1, 2, 3, 4, 5] as const;

const DEPARTMENT_OPTIONS = [
  { value: "Administration", label: "Administration" },
  { value: "SpecimenCollection", label: "Specimen Collection" },
  { value: "heamatology", label: "Haematology" }, // enum is lower-case h
  { value: "Chemistry", label: "Chemistry" },
  { value: "Offlines", label: "Offlines" },
  { value: "Cytology", label: "Cytology" },
  { value: "Bacteriology", label: "Bacteriology" },
  { value: "SpecialChemistry", label: "Special Chemistry" },
] as const;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: any) => void;   // parent does the mutation
  isCreating?: boolean;
};

export function UpdateProductDialog({
  isOpen,
  onClose,
  onCreate,
  isCreating = false,
}: Props) {
  // ✅ product list for dropdown
  const { data: productsRes, isLoading: loadingProducts } = useGetProductsQuery();

  // IMPORTANT: your ProductResponse seems to be { items, totalPages... }
  const products = (productsRes as any)?.items ?? [];

  const [selectedProductId, setSelectedProductId] = useState("");

  // ✅ fetch selected product
  const { data: product, isFetching: loadingProduct } = useGetProductByIdQuery(selectedProductId, {
    skip: !selectedProductId,
  });

  const [form, setForm] = useState({
    name: "",
    category: "",
    unit: "",
    rating: 0,
    Department: "",
    imageUrl: "",
  });

  useEffect(() => {
    if (!product) return;
    setForm({
      name: product.name ?? "",
      category: product.category ?? "",
      unit: product.unit ?? "",
      rating: Number(product.rating ?? 0),
      Department: product.Department ?? "",
      imageUrl: product.imageUrl ?? "",
    });
  }, [product]);

  const productOptions = useMemo(() => {
    return products
      .map((p: any) => ({ productId: p.productId, name: p.name }))
      .filter((p: any) => p.productId && p.name);
  }, [products]);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, name: e.target.value }));
  }

  function handleUnitChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, unit: e.target.value }));
  }

  function handleSubmit() {
    if (!selectedProductId) return toast.error("Select a product first.");
    if (!form.name.trim()) return toast.error("Product name is required.");

    if (form.category && !CATEGORY_OPTIONS.includes(form.category as any)) {
      return toast.error("Invalid category selected.");
    }

    if (form.Department) {
      const ok = DEPARTMENT_OPTIONS.some((d) => d.value === form.Department);
      if (!ok) return toast.error("Invalid department selected.");
    }

    onCreate({
      productId: selectedProductId,
      name: form.name.trim(),
      category: form.category || null,
      unit: form.unit || null,
      rating: Number(form.rating),
      Department: form.Department || null,
      imageUrl: form.imageUrl || null,
    });
  }

  const disabled = isCreating || loadingProducts || loadingProduct;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] p-6 rounded-2xl border border-neutral-200 bg-white shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-900">
            Update Product
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product dropdown */}
          <div>
            <Label>Select Product</Label>
            <Select
              value={selectedProductId}
              onValueChange={setSelectedProductId}
              disabled={loadingProducts || isCreating}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingProducts ? "Loading..." : "Choose a product"} />
              </SelectTrigger>
              <SelectContent className="z-[70] bg-white border-slate-200 shadow-lg" position="popper">
                {productOptions.map((p: any) => (
                  <SelectItem key={p.productId} value={p.productId}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product name */}
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input
              name="name"
              value={form.name}
              onChange={handleNameChange}
              disabled={!selectedProductId || disabled}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((prev) => ({ ...prev, category: v }))}
                disabled={!selectedProductId || disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 z-[70] shadow-lg" position="popper">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Unit */}
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input
                name="unit"
                value={form.unit}
                onChange={handleUnitChange}
                disabled={!selectedProductId || disabled}
                placeholder="e.g. box, ml, tubes"
              />
            </div>

            {/* Rating */}
            <div>
              <Label htmlFor="rating">Rating</Label>
              <Select
                value={String(form.rating)}
                onValueChange={(v) => setForm((prev) => ({ ...prev, rating: Number(v) }))}
                disabled={!selectedProductId || disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Rating" />
                </SelectTrigger>
                <SelectContent className="z-[70] bg-white border-slate-200 shadow-lg" position="popper">
                  {RATING_OPTIONS.map((num) => (
                    <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department */}
            <div>
              <Label htmlFor="Department">Department</Label>
              <Select
                value={form.Department}
                onValueChange={(v) => setForm((prev) => ({ ...prev, Department: v }))}
                disabled={!selectedProductId || disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent className="z-[70] bg-white border-slate-200 shadow-lg" position="popper">
                  {DEPARTMENT_OPTIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Image */}
          <div className="mt-3 mb-4">
            <Label>Product Image</Label>

            <UploadButton
              endpoint="imageUploader"
              onClientUploadComplete={(res) => {
                const file = res?.[0];
                if (!file) return;

                setForm((prev) => ({ ...prev, imageUrl: file.ufsUrl }));
                toast.success("Image uploaded");
              }}
              onUploadError={(error: Error) => {
                // ✅ show real reason
                console.error("UploadThing error:", error);
                toast.error(`Upload failed: ${error.message}`);
              }}
            />

            {form.imageUrl && (
              <p className="text-xs text-gray-500 mt-1 break-all">
                Image selected ✔
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={onClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!selectedProductId || disabled}>
              {isCreating ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
