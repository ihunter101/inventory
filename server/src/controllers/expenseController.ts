import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const expenses = await prisma.expenses.findMany({
      orderBy: { date: "desc" }
    });
    res.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
};

export const createExpense = async (req: Request, res: Response) => {
  const { category, amount, date, description, status = "pending" } = req.body;

  try {
    const newExpense = await prisma.expenses.create({
      data: {
        category,
        amount: parseFloat(amount),
        date: new Date(date),
        description,
        status,
      },
    });
    res.status(201).json(newExpense);
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ error: "Failed to create expense" });
  }
};

