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
exports.postGoodsReceipt = exports.createGoodsReceipt = exports.listGoodsReceipts = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
//const prisma = new PrismaClient();
const toGRNDTO = (g) => {
    var _a, _b, _c, _d;
    return ({
        id: g.id,
        grnNumber: g.grnNumber,
        poId: g.poId,
        poNumber: (_a = g.po) === null || _a === void 0 ? void 0 : _a.poNumber, // ⬅️ NEW
        invoiceId: (_b = g.invoiceId) !== null && _b !== void 0 ? _b : undefined,
        invoiceNumber: (_c = g.invoice) === null || _c === void 0 ? void 0 : _c.invoiceNumber, // ⬅️ NEW
        date: g.date instanceof Date ? g.date.toISOString() : g.date,
        status: g.status,
        lines: ((_d = g.lines) !== null && _d !== void 0 ? _d : []).map((ln) => {
            var _a, _b, _c, _d, _e;
            return ({
                productId: ln.productId,
                sku: (_b = (_a = ln.product) === null || _a === void 0 ? void 0 : _a.sku) !== null && _b !== void 0 ? _b : undefined,
                name: (_d = (_c = ln.product) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : "",
                unit: (_e = ln.unit) !== null && _e !== void 0 ? _e : "",
                receivedQty: Number(ln.receivedQty),
                unitPrice: ln.unitPrice == null ? undefined : Number(ln.unitPrice),
            });
        }),
    });
};
const listGoodsReceipts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { q } = req.query;
        const where = q
            ? {
                OR: [
                    { grnNumber: { contains: q, mode: "insensitive" } },
                    { po: { poNumber: { contains: q, mode: "insensitive" } } }, // search by poNumber
                    { invoice: { invoiceNumber: { contains: q, mode: "insensitive" } } }, // search by invoiceNumber
                ],
            }
            : undefined;
        const rows = yield prisma_1.prisma.goodsReceipt.findMany({
            where,
            include: {
                po: true,
                invoice: true,
                lines: { include: { product: true } },
            },
            orderBy: { date: "desc" },
        });
        return res.json(rows.map(toGRNDTO));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving goods receipts." });
    }
});
exports.listGoodsReceipts = listGoodsReceipts;
const createGoodsReceipt = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { grnNumber, poId, invoiceId, date, lines = [] } = req.body;
        if (!poId || !Array.isArray(lines) || lines.length === 0) {
            return res
                .status(400)
                .json({ error: "Purchase order ID and line items are required" });
        }
        const created = yield prisma_1.prisma.goodsReceipt.create({
            data: {
                grnNumber: grnNumber !== null && grnNumber !== void 0 ? grnNumber : `GRN-${Date.now()}`,
                poId,
                invoiceId: invoiceId !== null && invoiceId !== void 0 ? invoiceId : null,
                date: date ? new Date(date) : new Date(),
                status: client_1.GRNStatus.DRAFT,
                lines: {
                    create: lines.map((line) => {
                        var _a, _b, _c, _d;
                        return ({
                            product: { connect: { productId: String(line.productId) } },
                            unit: String((_b = (_a = line.unit) !== null && _a !== void 0 ? _a : line.uom) !== null && _b !== void 0 ? _b : ""),
                            receivedQty: Number((_c = line.receivedQty) !== null && _c !== void 0 ? _c : 0),
                            unitPrice: Number((_d = line.unitPrice) !== null && _d !== void 0 ? _d : 0),
                        });
                    }),
                },
            },
            include: {
                po: true, // ⬅️ include to expose poNumber
                invoice: true, // ⬅️ include to expose invoiceNumber
                lines: { include: { product: true } },
            },
        });
        return res.status(201).json(toGRNDTO(created));
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error creating goods receipt." });
    }
});
exports.createGoodsReceipt = createGoodsReceipt;
// postGoodsReceipt unchanged
const postGoodsReceipt = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const goodsReceipt = yield prisma_1.prisma.goodsReceipt.findUnique({
            where: { id },
            include: { lines: true, po: { include: { items: true } } },
        });
        if (!goodsReceipt)
            return res.status(404).json({ message: "Goods receipt not found." });
        if (goodsReceipt.status === "POSTED")
            return res.json({ ok: true });
        yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            // 1) increment stock + ledger
            for (const line of goodsReceipt.lines) {
                yield tx.products.update({
                    where: { productId: line.productId },
                    data: { stockQuantity: { increment: line.receivedQty } },
                });
                yield tx.stockLedger.create({
                    data: {
                        productId: line.productId,
                        sourceType: "GRN",
                        SourceId: goodsReceipt.id,
                        qtyChange: line.receivedQty,
                        memo: `Posted ${goodsReceipt.grnNumber}`,
                    },
                });
            }
            // 2) mark GRN POSTED
            yield tx.goodsReceipt.update({
                where: { id: goodsReceipt.id },
                data: { status: client_1.GRNStatus.POSTED },
            });
            // 3) update PO status
            const posted = yield tx.goodsReceipt.findMany({
                where: { poId: goodsReceipt.poId, status: client_1.GRNStatus.POSTED },
                include: { lines: true },
            });
            const receivedByProduct = new Map();
            for (const g of posted) {
                for (const ln of g.lines) {
                    receivedByProduct.set(ln.productId, ((_a = receivedByProduct.get(ln.productId)) !== null && _a !== void 0 ? _a : 0) + ln.receivedQty);
                }
            }
            const allOrdered = goodsReceipt.po.items;
            const fully = allOrdered.every((item) => { var _a; return ((_a = receivedByProduct.get(item.productId)) !== null && _a !== void 0 ? _a : 0) >= item.quantity; });
            yield tx.purchaseOrder.update({
                where: { id: goodsReceipt.poId },
                data: { status: fully ? "RECEIVED" : "PARTIALLY_RECEIVED" },
            });
        }));
        return res.json({ ok: true });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error posting goods receipt." });
    }
});
exports.postGoodsReceipt = postGoodsReceipt;
