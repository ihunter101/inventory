// lib/matching.ts

export type MatchRow = {
  key: string;
  poItemId: string | null;
  name: string;
  sku: string | null;
  unit: string | null;

  poQty: number; // The limit
  invQty: number; // What they are asking to be paid for
  grQty: number; // What we actually got (specific to this shipment)

  invUnitPrice: number;
  
  payableQty: number;
  payableAmount: number;

  status: "MATCHED" | "SHORT" | "OVER_BILLED" | "NO_GRN";
  lineOk: boolean;
  notes: string;
};

export default function buildMatchRows(
  po: any, 
  invoice: any, 
  grn: any
): MatchRow[] {
  const poItems = po?.items ?? [];
  const invLines = invoice?.lines ?? [];
  const grnLines = grn?.lines ?? [];

  // Helper to find PO Item details
  const getPOItem = (id: string) => poItems.find((p: any) => p.id === id);

  // We iterate through INVOICE lines because that is what we are paying
  return invLines.map((invLine: any, index: number) => {
    const poItemId = invLine.poItemId;
    const poItem = poItemId ? getPOItem(poItemId) : null;
    
    // Find corresponding GRN line (matched by PO Item ID is safest)
    // If your GRN lines have a direct invoiceLineId, use that instead.
    const grnLine = grnLines.find((g: any) => 
       (g.invoiceItemId === invLine.id) || // Strongest match
       (poItemId && g.poItemId === poItemId) // Fallback match
    );

    const name = invLine.name ?? invLine.description ?? poItem?.product?.name ?? "Unknown";
    const sku = poItem?.product?.sku ?? null;
    const unit = invLine.unit ?? invLine.uom ?? poItem?.unit ?? "";

    const poQty = Number(poItem?.quantity ?? 0);
    const invQty = Number(invLine.quantity ?? 0);
    const grQty = Number(grnLine?.receivedQty ?? 0);
    const invUnitPrice = Number(invLine.unitPrice ?? 0);

    // LOGIC: Payable is the lesser of Invoiced or Received
    const payableQty = Math.min(invQty, grQty);
    const payableAmount = payableQty * invUnitPrice;

    const notes: string[] = [];
    let status: MatchRow["status"] = "MATCHED";

    if (!grn) {
      status = "NO_GRN";
      notes.push("Waiting for Goods Receipt");
    } else if (grQty < invQty) {
      status = "SHORT";
      notes.push(`Short delivery: Invoiced ${invQty} but received ${grQty}`);
    } else if (invQty > poQty) {
      // Use this carefully, sometimes over-delivery is allowed
      notes.push(`Warning: Invoiced qty > Original PO qty`);
    }

    const lineOk = status === "MATCHED" && payableQty > 0;

    return {
      key: invLine.id ? `${invLine.id}-${index}` : `row-${index}`,
      poItemId: poItemId ?? null,
      name,
      sku,
      unit,
      poQty,
      invQty,
      grQty,
      invUnitPrice,
      payableQty,
      payableAmount,
      status,
      lineOk,
      notes: notes.join(" • "),
    };
  });
}