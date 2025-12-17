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
exports.createDraftProduct = exports.listDraftProducts = void 0;
const prisma_1 = require("../lib/prisma"); // adjust import
const listDraftProducts = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const drafts = yield prisma_1.prisma.draftProduct.findMany({
            orderBy: { createdAt: "desc" },
            select: { id: true, name: true, unit: true },
        });
        return res.json(drafts);
    }
    catch (err) {
        console.error("listDraftProducts error:", err);
        return res.status(500).json({ message: "Error fetching draft products." });
    }
});
exports.listDraftProducts = listDraftProducts;
const createDraftProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const name = String(req.body.name).trim();
        const unit = ((_a = req.body.unit) !== null && _a !== void 0 ? _a : "").toString().trim(); // normalize null -> ""
        const existing = yield prisma_1.prisma.draftProduct.findFirst({
            where: { name, unit },
        });
        const draft = existing
            ? existing
            : yield prisma_1.prisma.draftProduct.create({
                data: { name, unit },
            });
        return res.status(201).json(draft);
    }
    catch (e) {
        console.error("createDraftProduct error:", e);
        return res.status(500).json({ message: "Error creating draft product" });
    }
});
exports.createDraftProduct = createDraftProduct;
