import { PoData, PoItem } from '../types/purchaseOrderTypes'; 
// Import your database client here (e.g., import prisma from '../db/prisma';)
import { prisma } from "../lib/prisma"


/**
 * Fetches all necessary details for a Purchase Order,
 * including supplier info and all line items.
 * @param poId The unique ID of the Purchase Order.
 * @returns A promise that resolves to the PoData object.
 */
export const getPurchaseOrderDetails = async (poId: string): Promise<PoData> => {
  try {
    const poRecord = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        supplier: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                unit: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!poRecord) {
      throw new Error(`Purchase Order with ID ${poId} not found`);
    }

    const poItems: PoItem[] = poRecord.items.map((item) => ({
      productName: item.product.name,
      unit: item.product.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toNumber(),
      lineTotal: item.lineTotal.toNumber(),
    }));

    return {
      id: poRecord.id,
      poNumber: poRecord.poNumber,
      supplier: {
        name: poRecord.supplier.name,
        email: poRecord.supplier.email,
      },
      total: poRecord.total.toNumber(),
      items: poItems,
      name: poRecord.createdBy?.name ?? "",
    };
  } catch (error) {
    console.error(`Database error fetching PO ${poId}:`, error);
    throw new Error("Failed to retrieve Purchase Order data.");
  }
};
