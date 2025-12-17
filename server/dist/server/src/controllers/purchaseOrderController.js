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
exports.deletePurchaseOrder = exports.updatePurchaseOrder = exports.updatePOStatus = exports.createPurchaseOrder = exports.getPurchaseOrder = exports.listPurchaseOrders = void 0;
const prisma_1 = require("../lib/prisma");
//const prisma = new PrismaClient();
/** Frontend-friendly mapper: flattens supplier, coerces Decimals/Dates
 ** This decides what JSON fields your API actually sends to the frontend.
 **Cleans up the prisma messy response into a format compactible with the frontend.
*/
function toPurchaseOrderDTO(po) {
    var _a, _b, _c, _d, _e, _f;
    return {
        id: po.id,
        poNumber: po.poNumber,
        supplierId: po.supplierId,
        supplier: po.supplier
            ? {
                supplierId: po.supplier.supplierId,
                name: po.supplier.name,
                email: po.supplier.email,
                phone: po.supplier.phone,
                address: po.supplier.address
            }
            : undefined, // string for FE
        status: po.status,
        orderDate: po.orderDate instanceof Date ? po.orderDate.toISOString() : po.orderDate,
        dueDate: po.dueDate ? (po.dueDate instanceof Date ? po.dueDate.toISOString() : po.dueDate) : undefined,
        notes: (_a = po.notes) !== null && _a !== void 0 ? _a : undefined,
        items: ((_b = po.items) !== null && _b !== void 0 ? _b : []).map((it) => {
            var _a, _b, _c;
            return ({
                id: it.id,
                productId: it.productId,
                sku: undefined, // FE has optional sku
                name: (_b = (_a = it.product) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : it.name, // FE expects "name"
                unit: (_c = it.unit) !== null && _c !== void 0 ? _c : "",
                quantity: Number(it.quantity),
                unitPrice: Number(it.unitPrice), // Decimal -> number
                lineTotal: Number(it.lineTotal),
            });
        }),
        subtotal: Number(po.subtotal),
        tax: Number(po.tax),
        total: Number(po.total),
        invoiceCount: (_f = (_d = (_c = po._count) === null || _c === void 0 ? void 0 : _c.invoices) !== null && _d !== void 0 ? _d : (_e = po.invoices) === null || _e === void 0 ? void 0 : _e.length) !== null && _f !== void 0 ? _f : 0,
    };
}
const listPurchaseOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, q } = req.query;
        const where = {};
        // Normalize status to enum if provided & valid
        if (status && ["DRAFT", "APPROVED", "SENT", "PARTIALLY_RECEIVED", "RECEIVED", "CLOSED"].includes(status)) {
            where.status = status;
        }
        if (q && q.trim()) {
            where.OR = [
                { poNumber: { contains: q, mode: "insensitive" } },
                { supplier: { is: { name: { contains: q, mode: "insensitive" } } } }, // canonical form
            ];
        }
        const rows = yield prisma_1.prisma.purchaseOrder.findMany({
            where,
            include: {
                supplier: true,
                items: {
                    include: { product: true } // so we can get the name
                },
                grns: true,
                _count: { select: { invoices: true } },
            },
            orderBy: { orderDate: "desc" },
        });
        return res.json(rows.map(toPurchaseOrderDTO));
    }
    catch (error) {
        console.error("listPurchaseOrders error:", error);
        return res.status(500).json({ message: "Error retrieving purchase orders." });
    }
});
exports.listPurchaseOrders = listPurchaseOrders;
const getPurchaseOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const po = yield prisma_1.prisma.purchaseOrder.findUnique({
            where: { id },
            include: { supplier: true, items: true, invoices: true, grns: true },
        });
        if (!po) {
            return res.status(404).json({ message: "Purchase order not found." });
        }
        // Return consistent DTO shape
        return res.json(toPurchaseOrderDTO(po));
    }
    catch (error) {
        console.error("getPurchaseOrder error:", error);
        return res.status(500).json({ message: "Error retrieving purchase order." });
    }
});
exports.getPurchaseOrder = getPurchaseOrder;
const createPurchaseOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const { supplierId, supplier, items = [], poNumber, tax = 0, orderDate, dueDate, notes, } = req.body;
        // ---- basic validation ----
        if ((!supplierId && !supplier) || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: "supplierId or supplier, and items are required.",
            });
        }
        if (!supplierId && supplier) {
            if (!((_a = supplier.name) === null || _a === void 0 ? void 0 : _a.trim())) {
                return res.status(400).json({ message: "supplier.name is required." });
            }
        }
        // validate numbers for each item
        for (const it of items) {
            const qty = Number(it.quantity);
            const price = Number(it.unitPrice);
            if (!Number.isFinite(qty) || qty <= 0) {
                return res.status(400).json({ message: "Each item must have quantity > 0." });
            }
            if (!Number.isFinite(price) || price < 0) {
                return res.status(400).json({ message: "Each item must have unitPrice >= 0." });
            }
        }
        const subtotal = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);
        const total = subtotal + Number(tax);
        // ---- supplier relation (same as you had) ----
        const supplierRelation = supplierId
            ? { supplier: { connect: { supplierId } } }
            : ((_b = supplier === null || supplier === void 0 ? void 0 : supplier.email) === null || _b === void 0 ? void 0 : _b.trim())
                ? {
                    supplier: {
                        connectOrCreate: {
                            where: { email: supplier.email.trim() },
                            create: {
                                name: supplier.name.trim(),
                                email: supplier.email.trim(),
                                phone: ((_c = supplier.phone) === null || _c === void 0 ? void 0 : _c.trim()) || "",
                                address: ((_d = supplier.address) === null || _d === void 0 ? void 0 : _d.trim()) || "",
                            },
                        },
                    },
                }
                : {
                    supplier: {
                        create: {
                            name: supplier.name.trim(),
                            email: ((_e = supplier.email) === null || _e === void 0 ? void 0 : _e.trim()) || "",
                            phone: ((_f = supplier.phone) === null || _f === void 0 ? void 0 : _f.trim()) || "",
                            address: ((_g = supplier.address) === null || _g === void 0 ? void 0 : _g.trim()) || "",
                        },
                    },
                };
        // ---- create purchase order + items ----
        const created = yield prisma_1.prisma.purchaseOrder.create({
            data: Object.assign(Object.assign({ poNumber: poNumber !== null && poNumber !== void 0 ? poNumber : `PO-${Date.now()}`, orderDate: orderDate ? new Date(orderDate) : new Date(), dueDate: dueDate ? new Date(dueDate) : null, notes: notes || null, status: "DRAFT", subtotal, tax: Number(tax), total }, supplierRelation), { items: {
                    create: items.map((item) => {
                        var _a, _b, _c;
                        const quantity = Number(item.quantity);
                        const unitPrice = Number(item.unitPrice);
                        // we expect the frontend to send either:
                        // - item.productId  (DraftProduct.id), or
                        // - item.name + item.unit to create a new DraftProduct
                        const hasDraftId = typeof item.productId === "string" && item.productId.trim().length > 0;
                        const hasName = typeof item.name === "string" && item.name.trim().length > 0;
                        if (!hasDraftId && !hasName) {
                            // cleaner message than a Prisma relation error
                            throw new Error("DraftProduct missing: item has no productId and no name to create one.");
                        }
                        return {
                            description: (_a = item.description) !== null && _a !== void 0 ? _a : "",
                            unit: (_b = item.unit) !== null && _b !== void 0 ? _b : "",
                            quantity,
                            unitPrice,
                            lineTotal: quantity * unitPrice,
                            // 🔑 THIS MATCHES YOUR SCHEMA:
                            // productId is the FK to DraftProduct.id.
                            // We never set productId directly; Prisma fills it from this relation.
                            product: hasDraftId
                                ? { connect: { id: item.productId.trim() } }
                                : {
                                    create: {
                                        name: String(item.name).trim(),
                                        unit: String((_c = item.unit) !== null && _c !== void 0 ? _c : "").trim(),
                                    },
                                },
                            // promotedProductId / promotedProduct:
                            // not set at creation time; you’ll fill these later when you “promote”
                            // promotedProduct: { connect: { productId: ... } }
                        };
                    }),
                } }),
            include: {
                supplier: true,
                // use relation names from schema:
                items: {
                    include: {
                        product: true, // DraftProduct
                        promotedProduct: true, // Products (may be null initially)
                    },
                },
                _count: { select: { invoices: true } },
            },
        });
        return res.status(201).json(created);
    }
    catch (error) {
        console.error("createPurchaseOrder error:", error);
        // more human-friendly error for our custom message above
        if (String((error === null || error === void 0 ? void 0 : error.message) || "").includes("DraftProduct missing")) {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({ message: "Error creating purchase order." });
    }
});
exports.createPurchaseOrder = createPurchaseOrder;
const updatePOStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status || !["DRAFT", "APPROVED", "SENT", "PARTIALLY_RECEIVED", "RECEIVED", "CLOSED"].includes(status)) {
            return res.status(400).json({ message: "Invalid status." });
        }
        const updated = yield prisma_1.prisma.purchaseOrder.update({
            where: { id },
            data: { status },
            include: { supplier: true, items: true },
        });
        return res.json(toPurchaseOrderDTO(updated));
    }
    catch (error) {
        console.error("updatePOStatus error:", error);
        return res.status(500).json({ message: "Error updating purchase order." });
    }
});
exports.updatePOStatus = updatePOStatus;
/**
 * Defines what data to include when fetching a purchase order
 * - supplier: full supplier details
 * - items: all line items with their product references
 */
const purchaseOrderInclude = {
    supplier: true,
    items: {
        include: {
            product: true, // Draft product reference
            promotedProduct: true, // Promoted inventory product (if exists)
        },
    },
};
/**
 * Builds the Prisma relation object for connecting/creating a supplier
 *
 * Logic:
 * 1. If supplierId exists → connect to existing supplier
 * 2. If supplier has email → connectOrCreate (find by email or create new)
 * 3. Otherwise → create new supplier
 *
 * @param input - Object containing supplier data
 * @param input.supplierId - ID of existing supplier (if linking to one)
 * @param input.supplier - New supplier details (if creating one)
 * @returns Prisma relation object for supplier
 */
function buildSupplierRelation(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const { supplier, supplierId } = input;
    // Case 1: Link to existing supplier by ID
    if (supplierId) {
        return { supplier: { connect: { supplierId } } };
    }
    // Case 2: Create or find supplier by email
    if ((_a = supplier === null || supplier === void 0 ? void 0 : supplier.email) === null || _a === void 0 ? void 0 : _a.trim()) {
        return {
            supplier: {
                connectOrCreate: {
                    where: { email: supplier.email.trim() },
                    create: {
                        name: ((_b = supplier.name) === null || _b === void 0 ? void 0 : _b.trim()) || "",
                        email: supplier.email.trim(),
                        phone: ((_c = supplier.phone) === null || _c === void 0 ? void 0 : _c.trim()) || "",
                        address: ((_d = supplier.address) === null || _d === void 0 ? void 0 : _d.trim()) || "",
                    },
                },
            },
        };
    }
    // Case 3: Create new supplier without email check
    return {
        supplier: {
            create: {
                name: ((_e = supplier === null || supplier === void 0 ? void 0 : supplier.name) === null || _e === void 0 ? void 0 : _e.trim()) || "",
                email: ((_f = supplier === null || supplier === void 0 ? void 0 : supplier.email) === null || _f === void 0 ? void 0 : _f.trim()) || "",
                phone: ((_g = supplier === null || supplier === void 0 ? void 0 : supplier.phone) === null || _g === void 0 ? void 0 : _g.trim()) || "",
                address: ((_h = supplier === null || supplier === void 0 ? void 0 : supplier.address) === null || _h === void 0 ? void 0 : _h.trim()) || "",
            },
        },
    };
}
/**
 * Updates an existing purchase order
 *
 * This function:
 * 1. Extracts the PO ID from URL params
 * 2. Updates basic fields (tax, total, notes, dueDate)
 * 3. Updates supplier relationship (existing or new)
 * 4. Replaces all line items with new ones
 * 5. Recalculates subtotal and total
 *
 * @param req - Express request object
 * @param req.params.id - The purchase order ID
 * @param req.body - The updated PO data
 * @param res - Express response object
 */
const updatePurchaseOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const id = req.params.id;
    const { poNumber, total, subtotal, tax, notes, dueDate, orderDate, supplierId, supplier, items = [] } = req.body;
    try {
        // Validate ID exists
        if (!id || typeof id !== "string") {
            return res.status(400).json({
                message: "Invalid purchase order ID",
            });
        }
        // Validate items array
        if (!Array.isArray(items)) {
            return res.status(400).json({
                message: "Items must be an array",
            });
        }
        // Build the update data object
        const data = {};
        // Helper to convert date string to ISO-8601 DateTime
        const toISODateTime = (dateStr) => {
            if (!dateStr)
                return null;
            const trimmed = dateStr.trim();
            if (!trimmed)
                return null;
            // If it's already a full ISO string, return as-is
            if (trimmed.includes('T'))
                return trimmed;
            // Otherwise, assume it's YYYY-MM-DD and add time
            return `${trimmed}T00:00:00Z`;
        };
        // Update simple fields if provided
        if (poNumber !== undefined)
            data.poNumber = String(poNumber).trim();
        if (orderDate !== undefined) {
            const isoDate = toISODateTime(orderDate);
            if (isoDate)
                data.orderDate = isoDate;
        }
        if (dueDate !== undefined) {
            const isoDate = toISODateTime(dueDate);
            data.dueDate = isoDate;
        }
        if (notes !== undefined)
            data.notes = notes ? String(notes).trim() : null;
        if (tax !== undefined)
            data.tax = Number(tax);
        if (total !== undefined)
            data.total = Number(total);
        if (subtotal !== undefined)
            data.subtotal = Number(subtotal);
        // Update supplier if provided
        if (supplierId !== undefined || supplier !== undefined) {
            Object.assign(data, buildSupplierRelation({ supplier, supplierId }));
        }
        // Update items if provided
        if (items.length > 0) {
            const createItems = items.map((item, idx) => {
                const quantity = Number(item.quantity) || 0;
                const unitPrice = Number(item.unitPrice) || 0;
                // Validate: each item must have a productId (existing draft)
                const hasDraftId = typeof item.productId === "string" && item.productId.trim().length > 0;
                if (!hasDraftId) {
                    throw new Error(`Item ${idx + 1}: Must have a productId (existing draft product)`);
                }
                // Validate quantity
                if (quantity <= 0) {
                    throw new Error(`Item ${idx + 1}: Quantity must be greater than 0`);
                }
                // Map to PurchaseOrderItem fields (no 'name' field on item itself)
                const mappedItem = {
                    description: item.description ? String(item.description).trim() : null,
                    unit: item.unit ? String(item.unit).trim() : null,
                    unitPrice: unitPrice,
                    quantity: quantity,
                    lineTotal: unitPrice * quantity,
                    // Connect to existing draft product
                    product: { connect: { id: item.productId.trim() } },
                };
                return mappedItem;
            });
            // Calculate new subtotal from items
            const calculatedSubtotal = createItems.reduce((sum, it) => sum + Number(it.quantity) * Number(it.unitPrice), 0);
            data.subtotal = calculatedSubtotal;
            data.tax = Number(tax) || 0;
            data.total = calculatedSubtotal + (data.tax || 0);
            // Replace all items (delete old, create new)
            data.items = {
                deleteMany: {}, // Delete all existing items
                create: createItems,
            };
        }
        // Perform the update
        const updated = yield prisma_1.prisma.purchaseOrder.update({
            where: { id },
            data,
            include: purchaseOrderInclude,
        });
        console.log("Updated successfully. Items count:", updated.items.length);
        res.status(200).json(updated);
    }
    catch (error) {
        console.error("❌ updatePurchaseOrder error:", error);
        // Return appropriate status code based on error type
        const statusCode = ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes("not found")) ? 404 : 500;
        return res.status(statusCode).json({});
    }
});
exports.updatePurchaseOrder = updatePurchaseOrder;
// TODO: Append Controller Logic 
const deletePurchaseOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id: purchaseOrderId } = req.params;
    if (!purchaseOrderId) {
        return res.status(400).json({
            message: "Unable to delete purchase order. Missing purchase order ID.",
        });
    }
    try {
        const result = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Step 1: Get all items in this PO
            const items = yield tx.purchaseOrderItem.findMany({
                where: { poId: purchaseOrderId },
                select: { productId: true },
            });
            const productIds = items.map((item) => item.productId);
            // Step 2: Delete the PO (this cascades and deletes all PurchaseOrderItems)
            const deletedPurchase = yield tx.purchaseOrder.delete({
                where: { id: purchaseOrderId },
            });
            // Step 3: Find draft products that are ONLY used by this PO
            // (i.e., they have no other PO items pointing to them)
            const orphanedProducts = yield tx.draftProduct.findMany({
                where: {
                    id: { in: productIds },
                    poItems: {
                        none: {}, // No remaining PO items
                    },
                    // Also check they're not used in supplier invoices or goods receipts
                    supplierItems: {
                        none: {},
                    },
                    goodsReciept: {
                        none: {},
                    },
                },
                select: { id: true },
            });
            const orphanedProductIds = orphanedProducts.map((p) => p.id);
            // Step 4: Delete the orphaned draft products
            let deletedProductCount = 0;
            if (orphanedProductIds.length > 0) {
                const deletedProducts = yield tx.draftProduct.deleteMany({
                    where: {
                        id: { in: orphanedProductIds },
                    },
                });
                deletedProductCount = deletedProducts.count;
            }
            return {
                orderId: purchaseOrderId,
                deletedItemsCount: items.length,
                deletedProductCount: deletedProductCount,
            };
        }));
        return res.status(200).json(result);
    }
    catch (error) {
        console.error("Deletion transaction failed:", error);
        // Check if PO doesn't exist
        if (error.code === "P2025") {
            return res.status(404).json({
                message: "Purchase order not found.",
            });
        }
        return res.status(500).json({
            message: "Failed to delete the purchase order and associated products.",
            error: error.message,
        });
    }
});
exports.deletePurchaseOrder = deletePurchaseOrder;
