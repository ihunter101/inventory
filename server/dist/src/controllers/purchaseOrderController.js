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
exports.updatePOStatus = exports.createPurchaseOrder = exports.getPurchaseOrder = exports.listPurchaseOrders = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/** Frontend-friendly mapper: flattens supplier, coerces Decimals/Dates */
function toPurchaseOrderDTO(po) {
    var _a, _b, _c, _d;
    return {
        id: po.id,
        poNumber: po.poNumber,
        supplierId: po.supplierId,
        supplier: (_b = (_a = po.supplier) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : undefined, // string for FE
        status: po.status,
        orderDate: po.orderDate instanceof Date ? po.orderDate.toISOString() : po.orderDate,
        dueDate: po.dueDate ? (po.dueDate instanceof Date ? po.dueDate.toISOString() : po.dueDate) : undefined,
        notes: (_c = po.notes) !== null && _c !== void 0 ? _c : undefined,
        items: ((_d = po.items) !== null && _d !== void 0 ? _d : []).map((it) => {
            var _a, _b;
            return ({
                id: it.id,
                productId: it.productId,
                sku: undefined, // FE has optional sku
                name: (_a = it.description) !== null && _a !== void 0 ? _a : "", // FE expects "name"
                unit: (_b = it.unit) !== null && _b !== void 0 ? _b : "",
                quantity: Number(it.quantity),
                unitPrice: Number(it.unitPrice), // Decimal -> number
                lineTotal: Number(it.lineTotal),
            });
        }),
        subtotal: Number(po.subtotal),
        tax: Number(po.tax),
        total: Number(po.total),
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
        const rows = yield prisma.purchaseOrder.findMany({
            where,
            include: { supplier: true, items: true },
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
        const po = yield prisma.purchaseOrder.findUnique({
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
    try {
        const { supplierId, items = [], poNumber, tax = 0, orderDate, dueDate, notes } = req.body;
        if (!supplierId || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "supplierId and items are required." });
        }
        const subtotal = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);
        const total = subtotal + Number(tax);
        const created = yield prisma.purchaseOrder.create({
            data: {
                poNumber: poNumber !== null && poNumber !== void 0 ? poNumber : `PO-${Date.now()}`,
                supplierId,
                orderDate: orderDate ? new Date(orderDate) : new Date(),
                dueDate: dueDate ? new Date(dueDate) : null,
                notes,
                status: "DRAFT",
                subtotal,
                tax: Number(tax),
                total,
                items: {
                    create: items.map((item) => {
                        var _a, _b;
                        return ({
                            productId: item.productId,
                            description: (_b = (_a = item.description) !== null && _a !== void 0 ? _a : item.name) !== null && _b !== void 0 ? _b : "", // accept FE naming
                            unit: item.unit,
                            quantity: Number(item.quantity),
                            unitPrice: Number(item.unitPrice),
                            lineTotal: Number(item.quantity) * Number(item.unitPrice),
                        });
                    }),
                },
            },
            include: { supplier: true, items: true },
        });
        // Return the same flattened DTO shape
        return res.status(201).json(toPurchaseOrderDTO(created));
    }
    catch (error) {
        console.error("createPurchaseOrder error:", error);
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
        const updated = yield prisma.purchaseOrder.update({
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
