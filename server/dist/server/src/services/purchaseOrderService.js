"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPurchaseOrderDetails = void 0;
// Import your database client here (e.g., import prisma from '../db/prisma';)
const prisma_1 = require("../lib/prisma");
/**
 * Fetches all necessary details for a Purchase Order,
 * including supplier info and all line items.
 * @param poId The unique ID of the Purchase Order.
 * @returns A promise that resolves to the PoData object.
 */
const getPurchaseOrderDetails = (poId) => __awaiter(void 0, void 0, void 0, function* () {
    //  STEP 1: Implement your database query logic here.
    // Use your ORM (Prisma/Mongoose/etc.) to query the PO, its supplier, and its items.
    // Example placeholder (REPLACE THIS LOGIC with your actual database call):
    try {
        const poRecord = yield prisma_1.prisma.purchaseOrder.findUnique({
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
                            }
                        }
                    }
                }
            }
        });
        if (poRecord === null) {
            throw new Error("There are no purchase records ");
        }
        if (!poId) {
            throw new Error(`Purchase Order with ID; ${poId} not found`);
        }
        const poItems = poRecord.items.map(item => ({
            productName: item.product.name,
            unit: item.product.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toNumber(),
            lineTotal: item.lineTotal.toNumber(),
        }));
        const poData = {
            id: poRecord.id,
            poNumber: poRecord.poNumber,
            supplier: {
                name: poRecord.supplier.name,
                email: poRecord.supplier.email,
            },
            total: poRecord.total.toNumber(),
            items: poItems
        };
        return poData;
    }
    // **Temporary Hardcoded Mock Data (DELETE THIS LINE AND ABOVE BLOCK)**
    // **Use this mock data only for testing the PDF and Email flow before connecting DB**
    // return {
    //     id: poId,
    //     poNumber: "PO-MOCK-007",
    //     supplier: {
    //         name: "Acme Supplies Ltd",
    //         email: "test-recipient@mailinator.com", // <-- Use a test email here
    //     },
    //     total: 450.50,
    //     items: [
    //         { productName: "Steel Bars", quantity: 5, unitPrice: 50.00, unit: "kg" },
    //         { productName: "Safety Helmets", quantity: 10, unitPrice: 20.00, unit: "pcs" },
    //         { productName: "Gloves", quantity: 1, unitPrice: 5.50, unit: "box" },
    //     ],
    // };
    catch (error) {
        console.error(`Database error fetching PO ${poId}:`, error);
        throw new Error("Failed to retrieve Purchase Order data.");
    }
});
exports.getPurchaseOrderDetails = getPurchaseOrderDetails;
