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
exports.getInventory = getInventory;
exports.adjustInventory = adjustInventory;
exports.setInventory = setInventory;
const prisma_1 = require("../lib/prisma");
//const prisma = new PrismaClient();
function getInventory(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const products = yield prisma_1.prisma.products.findMany({
                include: { inventory: true },
                orderBy: {
                    name: "asc"
                },
            });
            const rows = products.map((p) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
                return ({
                    id: (_b = (_a = p.inventory) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : `missing-${p.productId}`,
                    productId: p.productId,
                    expiryDate: p.expiryDate,
                    category: p.category,
                    name: p.name,
                    stockQuantity: (_e = (_d = (_c = p.inventory) === null || _c === void 0 ? void 0 : _c.stockQuantity) !== null && _d !== void 0 ? _d : p.stockQuantity) !== null && _e !== void 0 ? _e : 0,
                    minQuantity: (_g = (_f = p.minQuantity) !== null && _f !== void 0 ? _f : p.minQuantity) !== null && _g !== void 0 ? _g : 0,
                    reorderPoint: (_k = (_j = (_h = p.inventory) === null || _h === void 0 ? void 0 : _h.reorderPoint) !== null && _j !== void 0 ? _j : p.reorderPoint) !== null && _k !== void 0 ? _k : 0,
                    lastCounted: ((_l = p.inventory) === null || _l === void 0 ? void 0 : _l.lastCountedAt)
                        ? p.inventory.lastCountedAt.toISOString()
                        : "",
                });
            });
            res.json(rows);
        }
        catch (error) {
            res.status(500).json({ message: "Error getting inventory" });
        }
    });
}
function adjustInventory(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { productId, delta: rawDelta, reason } = req.body;
            const delta = Number(rawDelta);
            if (!productId || !Number.isFinite(delta)) {
                return res.status(400).json({ message: "productId and Delta are required" });
            }
            const existing = yield prisma_1.prisma.inventory.findUnique({
                where: { productId }
            });
            if (!existing) {
                // there is **no inventory** row for this productId
                return res.status(404)
                    .json({ message: `Inventory row not found for productId ${productId}` });
            }
            const updatedInventory = yield prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const updatedStock = yield tx.inventory.update({
                    where: { productId },
                    data: { stockQuantity: { increment: delta } }
                });
                yield tx.products.update({
                    where: { productId },
                    data: { stockQuantity: { increment: delta } } //stock :{ inventory.StockQuantty}
                });
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.userId) || undefined;
                yield tx.stockLedger.create({
                    data: {
                        productId,
                        userId,
                        sourceType: "ADJUSTMENT",
                        SourceId: productId,
                        qtyChange: delta,
                        memo: reason !== null && reason !== void 0 ? reason : null
                    }
                });
                return updatedStock;
            }));
            console.log("Inventory and product item has been...");
            // TODO: write to stockLedger({productId, delta, reason, userId, ts})
            return res.json(updatedInventory);
        }
        catch (error) {
            return res.status(500).json({ message: "Inventory row not found for productId" });
        }
    });
}
function setInventory(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { productId, stockQuantity, lastCounted } = req.body;
            if (!productId || !Number.isInteger(stockQuantity)) {
                return res.status(400).json({ error: "Product Id and Stock Quantity is required" });
            }
            const current = yield prisma_1.prisma.inventory.findUnique({ where: { productId } });
            if (!current)
                return res.status(404).json({ error: "Inventory row not found for productId" });
            const delta = stockQuantity - current.stockQuantity;
            const finalStockCount = yield prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                yield tx.inventory.update({
                    where: { productId },
                    data: { stockQuantity, lastCountedAt: lastCounted ? new Date(lastCounted) : null }
                });
                // update Products
                yield tx.products.update({
                    where: { productId },
                    data: { stockQuantity },
                });
                //Update the StockLEdger
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.userId) || undefined;
                if (!userId)
                    return res.status(401).json({ error: "Not Authorized" });
                yield tx.stockLedger.create({
                    data: {
                        productId,
                        userId,
                        SourceId: productId,
                        sourceType: "STOCKTAKE",
                        qtyChange: delta,
                    }
                });
                //return finalStockCount
            }));
            return res.json(finalStockCount);
        }
        catch (error) {
            return res.status(500).json({ message: "Inventory row not found for productId" });
        }
    });
}
