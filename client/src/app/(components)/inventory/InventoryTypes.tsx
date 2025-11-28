import type { Status } from "../../utils/stock";
import type { Category } from "@/app/(components)/Products/CreateProductDialog"


export type InventoryRow = {
  productId: string;
  name: string;
  category?: Category;
  stockQuantity: number;
  minQuantity: number;
  reorderPoint?: number;
  unit?: string;
  expiryDate?: string | null;
  supplier?: string | null;
  location?: string | null;
};

export const formatNumber = (n?: number | null) =>
  n === undefined || n === null ? "—" : new Intl.NumberFormat().format(n);


export function deriveStatus(r: InventoryRow): Status {
  const q = r.stockQuantity ?? 0;
  const min = r.minQuantity ?? 0;
  const rp = r.reorderPoint ?? min;

  if (q <= Math.min(min, rp)) return "critical";
  if (q <= Math.max(min, rp)) return "low-stock";
  return "in-stock";
}
