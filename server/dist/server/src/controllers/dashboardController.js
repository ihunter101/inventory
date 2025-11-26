"use strict";
//controller defines the logic of what happens when a route requested
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
exports.getDashbaordMetrics = void 0;
const prisma_1 = require("../lib/prisma");
//const prisma = new PrismaClient();
const getDashbaordMetrics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const popularProducts = yield prisma_1.prisma.products.findMany({
            take: 15,
            orderBy: {
                stockQuantity: "desc"
            },
            // select: {
            // name: true,
            // stockQuantity: true,
            // price: true,
            // productId: true,
            // }
        });
        const salesSummary = yield prisma_1.prisma.salesSummary.findMany({
            take: 5,
            orderBy: {
                date: "desc"
            },
        });
        const purchaseSummary = yield prisma_1.prisma.purchaseSummary.findMany({
            take: 5,
            orderBy: {
                date: "desc"
            },
        });
        const expenseSummary = yield prisma_1.prisma.expenseSummary.findMany({
            take: 5,
            orderBy: {
                date: "desc"
            },
        });
        const expenseByCategorySummaryRaw = yield prisma_1.prisma.expenseByCategory.findMany({
            take: 5,
            orderBy: {
                date: "desc"
            },
        });
        const expenseByCategorySummary = expenseByCategorySummaryRaw.map((item) => {
            var _a;
            return ({
                expenseByCategorySummaryId: item.expenseByCategoryId,
                category: item.category,
                amount: Number((_a = item.amount) !== null && _a !== void 0 ? _a : 0), // <-- number, not string/BigInt
                date: item.date.toISOString(),
            });
        });
        const expenseByCategory = expenseByCategorySummaryRaw.map((item) => (Object.assign(Object.assign({}, item), { amount: item.amount.toString() })));
        // we need to return the dashboard metrics
        res.json({
            popularProducts,
            salesSummary,
            purchaseSummary,
            expenseSummary,
            expenseByCategorySummary
        });
    }
    catch (error) {
        res.status(500).json({ message: "error retrieving dashboard metrics" });
    }
});
exports.getDashbaordMetrics = getDashbaordMetrics;
