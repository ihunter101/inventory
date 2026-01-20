import { GrnData } from "../types/goodsReceiptTypes";
import { LineItem, GoodsReceiptPDFData} from "../services/grnPdfServices";
import {prisma} from "../lib/prisma"



export function mapGoodsReceiptDataToPDF(grn: GrnData): GoodsReceiptPDFData {
  const items: LineItem[] = grn.items.map((item) => {
    const unitPrice = Number(item.unitPrice ?? 0);
    const qty = Number(item.receivedQty);
    const total = Number(item.lineTotal ?? qty * unitPrice);

    return {
      name: item.productName,
      quantity: qty,
      unitPrice,
      total,
      unit: item.unit
    }
  })

  const subtotal = grn.subtotal ?? items.reduce((sum, it) => sum + it.total, 0);

  const total = grn.total ?? subtotal + Number(grn.tax ?? 0);
  const tax = grn.tax ?? (total - subtotal > 0 ? total - subtotal : 0)

  return {
    documentType: "GRN",
    title: "Goods Receipt Note",
    documentNumber: grn.grnNumber,
    preparedBy: grn.preparedBy ?? "System",
    organizationName: "Laboratory Services & Consultation Ltd.",

    supplierName: grn.supplier.name,
    supplierEmail: grn.supplier.email,
    receivedDate: grn.receivedDate ?? new Date().toISOString().slice(0, 10),
    //referene: reference to the purchase order and invoice made 

  items,
  subtotal,
  tax, 
  total, 
  notes: grn.notes
  }
}