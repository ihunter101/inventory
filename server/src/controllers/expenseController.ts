import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import  getGroupFromCategory  from "@lab/shared";
import { ExpenseGroup, ExpenseStatus } from "@prisma/client";


//const prisma = new PrismaClient();

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const { from, end, range = "month" } = req.query;

    const now = new Date();

    let startBoundary: Date;
    let endBoundary: Date = end ? new Date(end as string) : now;

    if (from) {
      startBoundary = new Date(from as string);
    } else {
      switch (range) {
        case "week":
          startBoundary = new Date(now);
          startBoundary.setDate(now.getDate() - 7);
          break;

        case "quarter": {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          startBoundary = new Date(now.getFullYear(), currentQuarter * 3, 1);
          break;
        }

        case "year":
          startBoundary = new Date(now.getFullYear(), 0, 1);
          break;

        case "all":
          startBoundary = new Date(2000, 0, 1);
          break;

        case "month":
        default:
          startBoundary = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }
    }

    if (isNaN(startBoundary.getTime())) {
      startBoundary = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    if (isNaN(endBoundary.getTime())) {
      endBoundary = now;
    }

    const expenses = await prisma.expenses.findMany({
      where: {
        createdAt: {
          gte: startBoundary,
          lte: endBoundary,
        },
      },
      include: {
        document: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return res.status(500).json({
      error: "Failed to fetch expenses",
    });
  }
};

export const createExpense = async (req: Request, res: Response) => {
  const {
    companyName,
    vendorName,
    category,
    amount,
    description,
    group,
    status = "PENDING",
    invoiceNumber,
    referenceNo,
    expenseDate,
    dueDate,
    paymentMethod,
    notes,
  } = req.body;

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

    const existingInvoice = await prisma.expenses.findUnique({
      where: {
        companyName,
        vendorName, 
        invoiceNumber,
      }
    })

    if (existingInvoice) {
      return res.status
    }
    const newExpense = await prisma.expenses.create({
      data: {
        companyName,
        vendorName,
        category,
        amount: Number(amount),
        description,
        status,
        group,
        invoiceNumber,
        referenceNo,
        expenseDate: expenseDate ? new Date(expenseDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        paymentMethod,
        notes,
      },
      include: {
        document: true,
      },
    });

    return res.status(201).json(newExpense);
  } catch (error) {
    console.error("Error creating expense:", error);
    return res.status(500).json({ error: "Failed to create expense" });
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

export const getExpenseById = async (req: Request, res: Response) => {
  try {
    const { expenseId } = req.params;

    if (!expenseId) {
      return res.status(400).json({
        error: "Expense ID is required.",
      });
    }

    const expense = await prisma.expenses.findUnique({
      where: { expenseId },
      include: {
        document: true,
      },
    });

    if (!expense) {
      return res.status(404).json({
        error: "Expense not found.",
      });
    }

    return res.status(200).json(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);

    return res.status(500).json({
      error: "Failed to fetch expense.",
    });
  }
};