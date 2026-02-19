export const PRICE_TOLERANCE = 0.01;

export type MatchRow = {
  key: string;

  // Identity
  poItemId?: string | null;
  invoiceItemId?: string | null;
  grnLineId?: string | null;

  sku?: string | null;
  name: string;
  unit?: string | null;

  // Quantities
  poQty: number;
  invQty: number;
  grnQty: number;

  // Pricing
  invUnitPrice: number | null;

  // Payment rule
  payableQty: number;        // min(grnQty, poQty)
  payableAmount: number;     // payableQty * invUnitPrice

  // Flags
  posted: boolean;
  lineOk: boolean;

  // Notes
  notes?: string;
};

function n(v: any) {
  const x = Number(v ?? 0);
  return Number.isFinite(x) ? x : 0;
}

function s(v: any) {
  const x = String(v ?? "").trim();
  return x.length ? x : null;
}

export default function buildMatchRows(po?: any, invoice?: any, grn?: any): MatchRow[] {
  const posted = grn?.status === "POSTED";

  const poItems: any[] = po?.items ?? [];
  const invItems: any[] = invoice?.items ?? [];
  const grnLines: any[] = grn?.lines ?? [];

  // --- Index by poItemId first (ideal)
  const poByPoItemId = new Map<string, any>();
  for (const it of poItems) if (it?.id) poByPoItemId.set(it.id, it);

  const invByPoItemId = new Map<string, any>();
  const invByDraftId = new Map<string, any>();
  for (const it of invItems) {
    if (it?.poItemId) invByPoItemId.set(it.poItemId, it);
    const draftId = it?.draftProductId ?? it?.draftProduct?.id;
    if (draftId) invByDraftId.set(draftId, it);
  }

  const grnByPoItemId = new Map<string, any>();
  const grnByDraftId = new Map<string, any>();
  for (const ln of grnLines) {
    if (ln?.poItemId) grnByPoItemId.set(ln.poItemId, ln);
    const draftId = ln?.productDraftId ?? ln?.draftProductId;
    if (draftId) grnByDraftId.set(draftId, ln);
  }

  // Build union keys:
  const keys = new Set<string>();

  for (const it of poItems) keys.add(`POITEM:${it.id}`);
  for (const it of invItems) {
    if (it?.poItemId) keys.add(`POITEM:${it.poItemId}`);
    else if (it?.draftProductId || it?.draftProduct?.id) keys.add(`DRAFT:${it.draftProductId ?? it.draftProduct.id}`);
  }
  for (const ln of grnLines) {
    if (ln?.poItemId) keys.add(`POITEM:${ln.poItemId}`);
    else if (ln?.productDraftId) keys.add(`DRAFT:${ln.productDraftId}`);
  }

  const rows: MatchRow[] = [];

  for (const k of keys) {
    const [kind, id] = k.split(":");

    let poIt: any | undefined;
    let invIt: any | undefined;
    let grnLn: any | undefined;

    if (kind === "POITEM") {
      poIt = poByPoItemId.get(id);
      invIt = invByPoItemId.get(id);
      grnLn = grnByPoItemId.get(id);
    } else {
      // DRAFT
      invIt = invByDraftId.get(id);
      grnLn = grnByDraftId.get(id);

      // If we can find PO via invIt.poItemId, attach it
      const poItemId = invIt?.poItemId ?? grnLn?.poItemId;
      if (poItemId) poIt = poByPoItemId.get(poItemId);
    }

    const poQty = n(poIt?.quantity);
    const invQty = n(invIt?.quantity);
    const grnQty = n(grnLn?.receivedQty);

    const invUnitPriceRaw = invIt?.unitPrice;
    const invUnitPrice = invUnitPriceRaw == null ? null : n(invUnitPriceRaw);

    // Payment rule: cap over-delivery to PO qty
    const payableQty = Math.max(0, Math.min(grnQty, poQty || grnQty)); 
    // if poQty is 0 (missing PO link), fall back to grnQty so you don’t accidentally pay 0

    const payableAmount =
      invUnitPrice == null ? 0 : Number((payableQty * invUnitPrice).toFixed(2));

    // notes + ok
    const notes: string[] = [];

    if (!posted) notes.push("GRN not posted");

    if (!invIt) notes.push("Missing invoice line");
    if (!grnLn) notes.push("Missing GRN line");
    if (!poIt) notes.push("Missing PO line link");

    if (grnQty < poQty) notes.push(`Short delivery: received ${grnQty} of ${poQty}`);
    if (grnQty > poQty && poQty > 0) notes.push(`Over-delivery: capped pay at ${poQty}`);

    if (invUnitPrice == null) notes.push("Missing invoice unit price");

    const lineOk =
      posted &&
      invUnitPrice != null &&
      grnQty >= 0 &&
      payableQty >= 0 &&
      !!invIt &&
      !!grnLn;

    rows.push({
      key: k,
      poItemId: poIt?.id ?? invIt?.poItemId ?? grnLn?.poItemId ?? null,
      invoiceItemId: invIt?.id ?? null,
      grnLineId: grnLn?.id ?? null,

      sku: s(poIt?.product?.sku ?? invIt?.product?.sku ?? invIt?.draftProduct?.sku),
      name: poIt?.product?.name ?? invIt?.product?.name ?? invIt?.draftProduct?.name ?? grnLn?.name ?? "Unnamed item",
      unit: poIt?.product?.unit ?? invIt?.unit ?? grnLn?.unit ?? null,

      poQty,
      invQty,
      grnQty,

      invUnitPrice,

      payableQty,
      payableAmount,

      posted,
      lineOk,
      notes: notes.join(" • "),
    });
  }

  // Optional: stable sorting by name
  rows.sort((a, b) => a.name.localeCompare(b.name));
  return rows;
}
