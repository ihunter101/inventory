import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import  getGroupFromCategory  from "@lab/shared";


//const prisma = new PrismaClient();

export const getExpenses = async (req: Request, res: Response) => {

  const { from, end } = req.query;

  let startBoundary = from ? new Date(from as string) : null;
    let endBoundary = end ? new Date(end as string) : null;

    // 2. Fallback: If dates are invalid or missing, default to "Fresh State"
    if (!startBoundary || isNaN(startBoundary.getTime())) {
      startBoundary = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    }
    if (!endBoundary || isNaN(endBoundary.getTime())) {
      endBoundary = new Date();
    }

  try {
    //we query by date the expense was created
    const expenses = await prisma.expenses.findMany({
      where: { createdAt: { gte: startBoundary, lte: endBoundary } },
      orderBy: { createdAt: "desc" }
    });
    res.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
};

export const createExpense = async (req: Request, res: Response) => {
  const { category, amount, date, description, group, status = "pending" } = req.body;

  try {
    const newExpense = await prisma.expenses.create({
      data: {
        category,
        amount: parseFloat(amount),
        //date: new Date(date),
        description,
        status,
        //group, //SEE PRIOR TODO
      },
    });

    res.status(201).json(newExpense);
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ error: "Failed to create expense" });
  }
};

