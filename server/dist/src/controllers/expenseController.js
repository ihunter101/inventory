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
exports.createExpense = exports.getExpenses = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getExpenses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const expenses = yield prisma.expenses.findMany({
            orderBy: { date: "desc" }
        });
        res.json(expenses);
    }
    catch (error) {
        console.error("Error fetching expenses:", error);
        res.status(500).json({ error: "Failed to fetch expenses" });
    }
});
exports.getExpenses = getExpenses;
const createExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { category, amount, date, description, status = "pending" } = req.body;
    try {
        const newExpense = yield prisma.expenses.create({
            data: {
                category,
                amount: parseFloat(amount),
                date: new Date(date),
                description,
                status,
            },
        });
        res.status(201).json(newExpense);
    }
    catch (error) {
        console.error("Error creating expense:", error);
        res.status(500).json({ error: "Failed to create expense" });
    }
});
exports.createExpense = createExpense;
