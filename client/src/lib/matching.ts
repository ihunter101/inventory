import {
  GoodsReceiptDTO,
  SupplierInvoiceDTO,
  PurchaseOrderDTO,
} from "@/app/state/api";

export const PRICE_TOLERANCE = 0.01;

export type MatchRow = {
  key: string;
  productId?: string;
  sku?: string;
  name: string;
  unit?: string;
  poQty?: number;
  invQty?: number;
  grQty?: number;
  poPrice?: number;
  invPrice?: number;
  lineOk: boolean;       // equality checks (ignores posted/not posted)
  notes?: string;
};

const n = (v: any) => (v == null || v === "" ? undefined : Number(v));
const s = (v: any) =>
  (v == null ? "" : String(v)).trim();

// normalize a secondary key when productId missing
const secondaryKey = (sku?: string, name?: string) =>
  s(sku || name).toLowerCase();

/**
 * Build rows for three-way match.
 * - Prefer matching by productId (stable).
 * - Fall back to (sku || name) case-insensitive.
 * - A line is “lineOk” when units, quantities and price are consistent.
 *   The *table* will additionally require GRN.status === POSTED to show overall OK.
 */
const buildMatchRows = (
  po?: PurchaseOrderDTO,
  inv?: SupplierInvoiceDTO,
  grn?: GoodsReceiptDTO
): MatchRow[] => {
  if (!po) return [];

  // Build lookups by productId and secondary key
  const invById = new Map<string, any>();
  const invByKey = new Map<string, any>();
  inv?.lines.forEach((ln) => {
    if (ln.productId) invById.set(String(ln.productId), ln);
    invByKey.set(secondaryKey(ln.sku, ln.name), ln);
  });

  const grnById = new Map<string, any>();
  const grnByKey = new Map<string, any>();
  grn?.lines.forEach((ln) => {
    if (ln.productId) grnById.set(String(ln.productId), ln);
    grnByKey.set(secondaryKey(ln.sku, ln.name), ln);
  });

  return po.items.map((p) => {
    const pid = p.productId ? String(p.productId) : undefined;

    const invLn =
      (pid && invById.get(pid)) ||
      invByKey.get(secondaryKey(p.sku as any, p.name));

    const grnLn =
      (pid && grnById.get(pid)) ||
      grnByKey.get(secondaryKey(p.sku as any, p.name));

    const sameUnit =
      !p.unit || !invLn?.unit
        ? true
        : s(p.unit).toLowerCase() === s(invLn.unit).toLowerCase();

    const poPrice = n(p.unitPrice);
    const invPrice = n(invLn?.unitPrice);
    const priceOk =
      invLn && poPrice != null && invPrice != null
        ? Math.abs(invPrice - poPrice) <= PRICE_TOLERANCE
        : true;

    const poQty = n(p.quantity);
    const invQty = n(invLn?.quantity);
    const qtyOk = invLn ? invQty === poQty : true;

    const expectedQty = invQty ?? poQty;
    const grQty = n(grnLn?.receivedQty);
    const grnOk = grnLn ? grQty === expectedQty : false;

    const lineOk = Boolean(sameUnit && priceOk && qtyOk && grnOk);

    const mismatches = [
      sameUnit ? null : "Unit",
      priceOk ? null : "Unit Price",
      qtyOk ? null : "Quantity",
      grnOk ? null : "Received Qty",
    ]
      .filter(Boolean)
      .join(", ");

    return {
      key: pid ?? secondaryKey(p.sku as any, p.name),
      productId: pid,
      sku: (p as any).sku,
      name: p.name,
      unit: p.unit,
      poQty: poQty,
      invQty: invQty,
      grQty: grQty,
      poPrice: poPrice,
      invPrice: invPrice,
      lineOk,
      notes: !lineOk ? `Mismatch: ${mismatches}` : undefined,
    };
  });
};

export default buildMatchRows;
