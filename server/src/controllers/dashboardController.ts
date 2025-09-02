//controller defines the logic of what happens when a route requested

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getDashbaordMetrics = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const popularProducts = await prisma.products.findMany({
            take: 15,
            orderBy:{
                stockQuantity: "desc"
            },
            // select: {
                // name: true,
                // stockQuantity: true,
                // price: true,
                // productId: true,
            // }
        });
        const salesSummary = await prisma.salesSummary.findMany({
            take: 5,
            orderBy: {
                date: "desc"
            },
        });

        const purchaseSummary = await prisma.purchaseSummary.findMany({
            take: 5,
            orderBy: {
                date: "desc"
            },
        });

        const expenseSummary = await prisma.expenseSummary.findMany({
            take: 5,
            orderBy: {
                date: "desc"
            },
        });

        const expenseByCategorySummaryRaw = await prisma.expenseByCategory.findMany({
            take: 5,
            orderBy: {
                date: "desc"
            },
        });

        const expenseByCategorySummary = expenseByCategorySummaryRaw.map((item) => ({
            expenseByCategorySummaryId: item.expenseByCategoryId,
            category: item.category,
            amount: Number(item.amount ?? 0),        // <-- number, not string/BigInt
            date: item.date.toISOString(),
    }));
        
        const expenseByCategory = expenseByCategorySummaryRaw.map(
            (item) => ({
                ...item,
                amount: item.amount.toString()
            }));

            // we need to return the dashboard metrics
            res.json({
                popularProducts,
                salesSummary,
                purchaseSummary,
                expenseSummary,
                expenseByCategorySummary
            })
        
    } catch (error) {
        res.status(500).json({ message: "error retrieving dashboard metrics" });
    }
}