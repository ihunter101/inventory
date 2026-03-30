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
export type Category = typeof CATEGORY_OPTIONS[number]

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
      <DialogContent className="w-[95vw] max-w-[650px] rounded-2xl border border-border/60 bg-card p-4 shadow-xl sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground sm:text-2xl">
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
              <SelectTrigger className="mt-2">
                <SelectValue placeholder={loadingProducts ? "Loading..." : "Choose a product"} />
              </SelectTrigger>
              <SelectContent className="z-[70] border border-border/60 bg-popover shadow-lg" position="popper">
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
              className="mt-2"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Category */}
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((prev) => ({ ...prev, category: v }))}
                disabled={!selectedProductId || disabled}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="z-[70] border border-border/60 bg-popover shadow-lg" position="popper">
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
                className="mt-2"
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
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select Rating" />
                </SelectTrigger>
                <SelectContent className="z-[70] border border-border/60 bg-popover shadow-lg" position="popper">
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
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent className="z-[70] border border-border/60 bg-popover shadow-lg" position="popper">
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

            <div className="mt-2">
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
            </div>

            {form.imageUrl && (
              <p className="mt-1 break-all text-xs text-muted-foreground">
                Image selected ✔
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse justify-end gap-3 pt-4 sm:flex-row">
            <Button variant="ghost" onClick={onClose} disabled={isCreating} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!selectedProductId || disabled} className="w-full sm:w-auto">
              {isCreating ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}