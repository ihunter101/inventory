import { prisma } from "../lib/prisma"

export type GrnData = {
  id: string;
  grnNumber: string;
  receivedDate?: string; 
  supplier: { 
    name: string;
    email?: string
  };
  items: Array<{
    productName: string;
    unit: string;
    receivedQty: number;
    unitPrice?: number;
    lineTotal?: number;
  }>,
  preparedBy: string;
}

export async function getGoodsReceiptDetails(grnId: string): Promise<GrnData> {
  const grn = await prisma.goodsReceipt.findUnique({
    where: { id: grnId},
    include: {
      lines: {
        include: {
          product: { select: {name: true, unit: true} },
          promotedProduct: { select: {name: true, unit: true}}
        }
      }
      //TODO: edit the grn schema to have a prepared by field and qury and retunt ot here
    }
  })
  if (!grn) {
    throw new Error("GRN not found")
  }

  const preparedBy = "System"
  const items = grn.lines.map((l) => {
    const p = l.promotedProduct ?? l.product
    return {
      productName: p?.name ?? "unknonw",
      unit: p?.unit ?? "",
      receivedQty: Number(l.receivedQty),
    }
  })
  if (!grn.poId) {
    throw new Error("This goods receipt is missing a purchase order id")
  }
  
  const matchedPO = await prisma.purchaseOrder.findUnique({
    where: { id: grn.poId},
    select: {
      supplier: { select: { name: true, email: true} },
    }
  })
  return {
    id: grn.id,
    grnNumber: grn.grnNumber,
    supplier: { name: matchedPO?.supplier.name ?? "Supplier", email: matchedPO?.supplier.name ?? ""},
    receivedDate: grn.date ? new Date(grn.date).toLocaleDateString(): "",
    items, 
    preparedBy
  }
}