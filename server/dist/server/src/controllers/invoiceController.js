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
exports.markInvoicePaid = exports.createInvoice = exports.listInvoices = void 0;
const prisma_1 = require("../lib/prisma");
//const prisma = new PrismaClient();
/** Frontend-friendly mapper: flatten supplier, coerce Decimals/Dates, map line fields */
function toInvoiceDTO(inv) {
    var _a, _b, _c, _d;
    return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        supplierId: inv.supplierId,
        supplier: (_b = (_a = inv.supplier) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : undefined, // FE expects string
        poId: (_c = inv.poId) !== null && _c !== void 0 ? _c : undefined,
        status: inv.status, // "PENDING" | "PAID" | "OVERDUE"
        date: inv.date instanceof Date ? inv.date.toISOString() : inv.date,
        dueDate: inv.dueDate
            ? inv.dueDate instanceof Date
                ? inv.dueDate.toISOString()
                : inv.dueDate
            : undefined,
        lines: ((_d = inv.items) !== null && _d !== void 0 ? _d : []).map((it) => {
            var _a, _b, _c;
            return ({
                productId: it.productId,
                sku: undefined, // optional on FE
                name: (_a = it.description) !== null && _a !== void 0 ? _a : "", // FE uses "name"
                unit: (_c = (_b = it.uom) !== null && _b !== void 0 ? _b : it.unit) !== null && _c !== void 0 ? _c : "", // schema uses "uom"; tolerate "unit"
                quantity: Number(it.quantity),
                unitPrice: Number(it.unitPrice),
                lineTotal: Number(it.lineTotal),
            });
        }),
        amount: Number(inv.amount),
    };
}
const listInvoices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, q } = req.query;
        const where = {};
        // Validate/normalize status
        if (status && ["PENDING", "PAID", "OVERDUE"].includes(status)) {
            where.status = status;
        }
        if (q && q.trim()) {
            where.OR = [
                { invoiceNumber: { contains: q, mode: "insensitive" } },
                { supplier: { is: { name: { contains: q, mode: "insensitive" } } } },
            ];
        }
        const rows = yield prisma_1.prisma.supplierInvoice.findMany({
            where,
            include: { supplier: true, items: true, po: true },
            orderBy: { date: "desc" },
        });
        return res.json(rows.map(toInvoiceDTO));
    }
    catch (error) {
        console.error("listInvoices error:", error);
        res.status(500).json({ message: "Error retrieving supplier invoices." });
    }
});
exports.listInvoices = listInvoices;
const createInvoice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { invoiceNumber, supplierId, poId, date, dueDate, lines = [] } = req.body;
        if (!invoiceNumber || !supplierId || !Array.isArray(lines) || lines.length === 0) {
            return res
                .status(400)
                .json({ error: "invoiceNumber, supplierId and non-empty line items are required" });
        }
        const amount = lines.reduce((s, l) => s + Number(l.quantity) * Number(l.unitPrice), 0);
        const created = yield prisma_1.prisma.supplierInvoice.create({
            data: {
                invoiceNumber,
                supplierId,
                poId: poId !== null && poId !== void 0 ? poId : null,
                date: date ? new Date(date) : new Date(),
                dueDate: dueDate ? new Date(dueDate) : null,
                status: "PENDING",
                amount,
                items: {
                    create: lines.map((line) => {
                        var _a, _b, _c, _d;
                        return ({
                            productId: line.productId,
                            description: (_b = (_a = line.description) !== null && _a !== void 0 ? _a : line.name) !== null && _b !== void 0 ? _b : "",
                            // schema field is "uom"
                            uom: (_d = (_c = line.unit) !== null && _c !== void 0 ? _c : line.uom) !== null && _d !== void 0 ? _d : "",
                            quantity: Number(line.quantity),
                            unitPrice: Number(line.unitPrice),
                            lineTotal: Number(line.quantity) * Number(line.unitPrice),
                        });
                    }),
                },
            },
            include: { supplier: true, items: true, po: true },
        });
        return res.status(201).json(toInvoiceDTO(created));
    }
    catch (error) {
        console.error("createInvoice error:", error);
        res.status(500).json({ message: "Error creating supplier invoice." });
    }
});
exports.createInvoice = createInvoice;
const markInvoicePaid = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // If you want to accept a status or paidDate from FE, read them here:
        // const { status, paidDate } = req.body;
        const updated = yield prisma_1.prisma.supplierInvoice.update({
            where: { id },
            data: { status: "PAID" },
            include: { supplier: true, items: true, po: true },
        });
        return res.json(toInvoiceDTO(updated));
    }
    catch (error) {
        console.error("markInvoicePaid error:", error);
        res.status(500).json({ message: "Error updating invoice." });
    }
});
exports.markInvoicePaid = markInvoicePaid;
