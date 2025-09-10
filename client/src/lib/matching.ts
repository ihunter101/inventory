import { GoodsReceiptDTO, SupplierInvoiceDTO, PurchaseOrderDTO } from "@/app/state/api";

export  const PRICE_TOLERANCE = 0.01;

export type MatchRow = {
    key: string;
    sku?: string;
    name: string;
    unit?: string;
    poQty?: number;
    invQty?: number; 
    grQty?: number;
    poPrice?: number;
    invPrice?: number;
    lineOk: boolean;
    notes?: string;
}


 const buildMatchRows  = (po?: PurchaseOrderDTO, inv?: SupplierInvoiceDTO, grn? : GoodsReceiptDTO) : MatchRow[] => {

    if (!po) return [];

    const invMap = new Map<string, any>();
     inv?.lines.forEach((line) => invMap.set((line.sku ?? line.name).toLowerCase(), line));

    const grnMap = new Map<string, any>();
    grn?.lines.forEach((line) =>  grnMap.set((line.sku ?? line.name).toLowerCase(), line));

    return po.items.map((p) => {
        const k = (p.sku ?? p.name).toLowerCase();
        const invLn = invMap.get(k);
        const grnLn = grnMap.get(k);

        const sameunit = !p.unit || !invLn?.unit ? true : String(p.unit).toLowerCase() === String(invLn?.unit).toLowerCase();
        const priceOk = invLn ? Math.abs(invLn.unitPrice - p.unitPrice) <= PRICE_TOLERANCE : true;
        const qtyOk = invLn ? invLn.quantity === p.quantity : true;
        const grnOk = grnLn ? grnLn.receivedQty === ( invLn?.quantity ??p.quantity) : false;
        const lineOk = sameunit && priceOk && qtyOk && grnOk;

        return {
            key: k,
            sku: p.sku,
            name: p.name,
            unit: p.unit,
            poQty: p.quantity,
            invQty: invLn?.quantity,
            grQry: grnLn?.receivedQty,
            poPrice: p.unitPrice,
            invPrice: invLn?.unitPrice,
            lineOk,
            notes: !lineOk ? 
                `Mismatch: ${[sameunit ? null: "Unit", priceOk ? null : "Unit Price", qtyOk ? null : "Quantity", grnOk ? null : "Received Qty" ]
                   .filter(Boolean)
                   .join(", ")}` 
                : undefined, 
                };
        }
    );

}

export default buildMatchRows