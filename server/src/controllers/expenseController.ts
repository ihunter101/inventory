import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import  getGroupFromCategory  from "@lab/shared";
import { ExpenseGroup, ExpenseStatus } from "@prisma/client";


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
  const { category, amount, description, group, status = "PENDING" } = req.body;

    if (!category || typeof category !== "string") {
    return res.status(400).json({ error: "Category is required" });
  }

  if (amount === undefined || isNaN(Number(amount))) {
    return res.status(400).json({ error: "Amount must be a valid number" });
  }

  if (!group || !Object.values(ExpenseGroup).includes(group)) {
    return res.status(400).json({ error: "Invalid expense group" });
  }

  if (status && !Object.values(ExpenseStatus).includes(status)) {
    return res.status(400).json({ error: "Invalid expense status" });
  }

  try {
    const newExpense = await prisma.expenses.create({
      data: {
        category,
        amount: parseFloat(amount),
        //date: new Date(date),
        description,
        status,
        group, 
      },
    });

    res.status(201).json(newExpense);
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ error: "Failed to create expense" });
  }
};


export const updateExpenseStatus = async (req: Request, res: Response) => {
  const { expenseId } = req.params;
  const { status } = req.body as { status?: ExpenseStatus };

  if (!expenseId) {
    return res.status(400).json({ error: "Expense ID is required" });
  }

  if (!status || !Object.values(ExpenseStatus).includes(status)) {
    return res.status(400).json({ error: "Invalid expense status" });
  }

  try {
    const existing = await prisma.expenses.findUnique({
      where: { expenseId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const updated = await prisma.expenses.update({
      where: { expenseId },
      data: { status },
    });

    return res.json(updated);
  } catch (error) {
    console.error("Error updating expense status:", error);
    return res.status(500).json({ error: "Failed to update expense status" });
  }
};