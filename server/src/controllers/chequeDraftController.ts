import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma }from "../lib/prisma";

function getMonthBoundaries(from?: string, end?: string) {
  const now = new Date();

  let startBoundary = from
    ? new Date(from)
    : new Date(now.getFullYear(), now.getMonth(), 1);

  let endBoundary = end ? new Date(end) : now;

  if (Number.isNaN(startBoundary.getTime())) {
    startBoundary = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  if (Number.isNaN(endBoundary.getTime())) {
    endBoundary = now;
  }

  return {
    startBoundary,
    endBoundary,
  };
}

export const getChequeDraftExpenseGroups = async (
  req: Request,
  res: Response
) => {
  try {
    const { from, end } = req.query;

    const { startBoundary, endBoundary } = getMonthBoundaries(
      from as string | undefined,
      end as string | undefined
    );

    const expenses = await prisma.expenses.findMany({
      where: {
        status: {
          notIn: ["PAID", "VOID"],
        },

        chequeDraftId: null,

        OR: [
          {
            expenseDate: {
              gte: startBoundary,
              lte: endBoundary,
            },
          },
          {
            expenseDate: null,
            createdAt: {
              gte: startBoundary,
              lte: endBoundary,
            },
          },
        ],
      },
      include: {
        document: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const grouped = expenses.reduce((acc, expense) => {
      const payeeName =
        expense.companyName?.trim() ||
        expense.vendorName?.trim() ||
        "Unknown company";

      if (!acc[payeeName]) {
        acc[payeeName] = {
          payeeName,
          totalAmount: 0,
          expenseCount: 0,
          expenses: [],
        };
      }

      acc[payeeName].totalAmount += Number(expense.amount || 0);
      acc[payeeName].expenseCount += 1;
      acc[payeeName].expenses.push(expense);

      return acc;
    }, {} as Record<string, {
      payeeName: string;
      totalAmount: number;
      expenseCount: number;
      expenses: typeof expenses;
    }>);

    const groups = Object.values(grouped).sort(
      (a, b) => b.totalAmount - a.totalAmount
    );

    return res.status(200).json(groups);
  } catch (error) {
    console.error("Failed to get cheque draft expense groups:", error);

    return res.status(500).json({
      message: "Failed to get cheque draft expense groups.",
    });
  }
};

export const createChequeDraft = async (req: Request, res: Response) => {
  try {
    const {
      payeeName,
      expenseIds,
      chequeDate,
      memo,
    } = req.body as {
      payeeName?: string;
      expenseIds?: string[];
      chequeDate?: string;
      memo?: string;
    };

    if (!payeeName || typeof payeeName !== "string") {
      return res.status(400).json({
        message: "Payee name is required.",
      });
    }

    if (!Array.isArray(expenseIds) || expenseIds.length === 0) {
      return res.status(400).json({
        message: "At least one expense is required.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const expenses = await tx.expenses.findMany({
        where: {
          expenseId: {
            in: expenseIds,
          },
          status: {
            notIn: ["PAID", "VOID"],
          },
          chequeDraftId: null,
        },
      });

      if (expenses.length === 0) {
        throw new Error("No valid unpaid expenses found for this cheque draft.");
      }

      const totalAmount = expenses.reduce((sum, expense) => {
        return sum + Number(expense.amount || 0);
      }, 0);

      if (totalAmount <= 0) {
        throw new Error("Cheque draft amount must be greater than zero.");
      }

      const chequeDraft = await tx.chequeDraft.create({
        data: {
          payeeName,
          amount: new Prisma.Decimal(totalAmount.toFixed(2)),
          currency: expenses[0]?.currency || "XCD",
          chequeDate: chequeDate ? new Date(chequeDate) : new Date(),
          memo:
            memo ||
            `Draft cheque for ${expenses.length} expense(s) - ${payeeName}`,
          status: "DRAFT",
        },
      });

      await tx.expenses.updateMany({
        where: {
          expenseId: {
            in: expenses.map((expense) => expense.expenseId),
          },
        },
        data: {
          chequeDraftId: chequeDraft.chequeDraftId,
          status: "APPROVED",
        },
      });

      const fullChequeDraft = await tx.chequeDraft.findUnique({
        where: {
          chequeDraftId: chequeDraft.chequeDraftId,
        },
        include: {
          expenses: {
            include: {
              document: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          chequePayment: true,
        },
      });

      return fullChequeDraft;
    });

    return res.status(201).json({
      message: "Cheque draft created successfully.",
      chequeDraft: result,
    });
  } catch (error) {
    console.error("Failed to create cheque draft:", error);

    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to create cheque draft.",
    });
  }
};

export const getChequeDrafts = async (req: Request, res: Response) => {
  try {
    const chequeDrafts = await prisma.chequeDraft.findMany({
      include: {
        expenses: true,
        chequePayment: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(chequeDrafts);
  } catch (error) {
    console.error("Failed to get cheque drafts:", error);

    return res.status(500).json({
      message: "Failed to get cheque drafts.",
    });
  }
};

export const getChequeDraftById = async (req: Request, res: Response) => {
  try {
    const { chequeDraftId } = req.params;

    const chequeDraft = await prisma.chequeDraft.findUnique({
      where: {
        chequeDraftId,
      },
      include: {
        expenses: {
          include: {
            document: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        chequePayment: true,
      },
    });

    if (!chequeDraft) {
      return res.status(404).json({
        message: "Cheque draft not found.",
      });
    }

    return res.status(200).json(chequeDraft);
  } catch (error) {
    console.error("Failed to get cheque draft:", error);

    return res.status(500).json({
      message: "Failed to get cheque draft.",
    });
  }
};

export const voidChequeDraft = async (req: Request, res: Response) => {
  try {
    const { chequeDraftId } = req.params;

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.chequeDraft.findUnique({
        where: {
          chequeDraftId,
        },
        include: {
          expenses: true,
        },
      });

      if (!existing) {
        throw new Error("Cheque draft not found.");
      }

      if (existing.status === "MATCHED") {
        throw new Error("Cannot void a cheque draft already matched to QuickBooks.");
      }

      await tx.expenses.updateMany({
        where: {
          chequeDraftId,
          status: "APPROVED",
        },
        data: {
          chequeDraftId: null,
          status: "PENDING",
        },
      });

      const updatedChequeDraft = await tx.chequeDraft.update({
        where: {
          chequeDraftId,
        },
        data: {
          status: "VOID",
        },
        include: {
          expenses: true,
          chequePayment: true,
        },
      });

      return updatedChequeDraft;
    });

    return res.status(200).json({
      message: "Cheque draft voided successfully.",
      chequeDraft: result,
    });
  } catch (error) {
    console.error("Failed to void cheque draft:", error);

    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to void cheque draft.",
    });
  }
};