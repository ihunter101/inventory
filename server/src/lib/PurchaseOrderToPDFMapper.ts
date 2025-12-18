import { PoData } from "../types/purchaseOrderTypes";
import { PurchaseOrderPDFData, LineItem } from "../services/pdfServices";

export function mapPurchaseOrderDataToPDF(po: PoData): PurchaseOrderPDFData {
  // convert PoItem[] → LineItem[]
  const items: LineItem[] = po.items.map((item) => ({
    name: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    unit: item.unit,
    total: item.lineTotal ?? item.quantity * item.unitPrice,
  }));

  const subtotal = items.reduce((sum, it) => sum + it.total, 0);

  return {
    documentType: "PO",
    title: "Purchase Order",
    documentNumber: po.poNumber,
    preparedBy: "System", // or pull from user/context later
    organizationName: "Laboratory Services & Consultations Ltd.",
    // departmentName: "Purchasing", // optional

    supplierName: po.supplier.name,
    supplierEmail: po.supplier.email,
    expectedDeliveryDate: "N/A", // or derive from PO
    orderDate: new Date().toISOString().slice(0, 10),

    items,
    subtotal,
    total: po.total,
    tax: po.total - subtotal > 0 ? po.total - subtotal : 0,

    // notes: "Optional notes here",
    // approvedBy: "Manager Name",
  };
}
