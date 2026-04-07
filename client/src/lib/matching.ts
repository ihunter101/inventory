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

const round2 = (value: number): number =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export default function buildMatchRows(
  po: any, 
  invoice: any, 
  grn: any
): MatchRow[] {
  const poItems = po?.items ?? [];
  const invLines = invoice?.lines ?? [];
  const grnLines = grn?.lines ?? [];

  /**
   * Helper function that find the PO item by ID
   * @param id 
   * @returns 
   */
  const getPOItem = (id: string) => poItems.find((p: any) => p.id === id);

  // Figure out invoice subtotal from line items
  // invoice.amount is being treated as the grand total (subtotal + tax)
  const invoiceSubtotal = round2(
    invLines.reduce((sum: number, line: any): number => {
      const qty = Number(line.quantity ?? 0);
      const unitPrice = Number(line.unitPrice ?? 0);
      return sum + qty * unitPrice;
    }, 0)
  );

  const invoiceGrandTotal = round2(Number(invoice?.amount ?? 0));
  const invoiceTax = round2(Math.max(invoiceGrandTotal - invoiceSubtotal, 0));

  // We iterate through INVOICE lines because that is what we are paying
  const baseRows: MatchRow[] = invLines.map((invLine: any, index: number): MatchRow => {
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
    const lineSubtotal = round2(payableQty * invUnitPrice);

    const notes: string[] = [];
    let status: MatchRow["status"] = "MATCHED";

    if (!grn) {
      status = "NO_GRN";
      notes.push("Waiting for Goods Receipt");
    } else if (grQty < invQty) {
      status = "SHORT";
      notes.push(`Short delivery: Invoiced ${invQty} but received ${grQty}`);
    } else if (invQty > poQty) {
      status = "OVER_BILLED";
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
      payableAmount: lineSubtotal, // temporary subtotal; tax will be added below
      status,
      lineOk,
      notes: notes.join(" • "),
    };
  });

  // Prorate invoice tax across payable lines
  const payableSubtotal = round2(
    baseRows.reduce((sum: number, row: MatchRow): number => {
      return sum + Number(row.payableAmount ?? 0);
    }, 0)
  );

  if (invoiceTax <= 0 || payableSubtotal <= 0) {
    return baseRows;
  }

  let allocatedTax = 0;

  return baseRows.map((row: MatchRow, index: number): MatchRow => {
    const lineSubtotal = Number(row.payableAmount ?? 0);

    let lineTaxShare = 0;

    if (index === baseRows.length - 1) {
      // Put any rounding remainder on the last row
      lineTaxShare = round2(invoiceTax - allocatedTax);
    } else {
      lineTaxShare = round2((lineSubtotal / payableSubtotal) * invoiceTax);
      allocatedTax = round2(allocatedTax + lineTaxShare);
    }

    return {
      ...row,
      payableAmount: round2(lineSubtotal + lineTaxShare),
    };
  });
}