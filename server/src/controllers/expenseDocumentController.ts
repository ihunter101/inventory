import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { extractExpenseDataFromPdf } from "../services/expenseAiExtractionService";


export const getExpenseDocumentById = async (req: Request, res: Response) => {
    try {
        const { documentId } = req.params;

        const document = await prisma.expenseDocument.findMany({
          where: { documentId },
          include: {
            expense: true
          },
        });

        if (!document) {
          return res.status(404).json({ message: "Expense Document not found"})
        }
    } catch (error) {
        console.error("Failed to get expense document: ", error)
        return res.status(500).json({ message: "Failed to get expense document."})
    }
}


export const extractExpenseDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params

    const document = await prisma.expenseDocument.findUnique({
      where: { documentId, },
    });

    if (!document) {
      return res.status(404).json({ message: "Expense document not found."})
    }

    if (!document.fileUrl) {
      return res.status(400).json({
        message: "This document does not have a valid file URL."
      })
    }

    await prisma.expenseDocument.update({
      where: { documentId, },
      data: {
        status: "PROCESSESING",
        aiError: null
      },
    });

    const extractedData = await extractExpenseDataFromPdf(document.fileUrl);

    const updatedDocument = await prisma.expenseDocument.update({
      where: { documentId },
      data: {
        aiExtractedJson: extractedData,
        status: "AI_EXTRACTED"
      },
    });

    return res.status(200).json({ 
      message: "Expense Document extracted sucessfully.",
      document: updatedDocument,
      extractedData,
    });

  } catch (error) {
    console.error("Failed to extract expense document:", error);
  
  const { documentId } = req.params;

  if (document) {
    await prisma.expenseDocument.update({
      where: { documentId },
      data: {
        status: "FAILED",
        aiError: error instanceof Error ? error.message : "Unknown AI Extraction error"
      },
    }).catch(() => {})
  }
  return res.status(500).json({ message: "Failed to extract expense document"})
}
};


export async function createExpenseDocument(req: Request, res: Response) {
  try {
    const {
      uploadThingKey,
      fileUrl,
      fileName,
      mimeType,
      sizeBytes,
    } = req.body;

    if (!uploadThingKey || !fileUrl || !fileName) {
      return res.status(400).json({
        message: "uploadThingKey, fileUrl, and fileName are required.",
      });
    }

    const document = await prisma.expenseDocument.create({
      data: {
        uploadThingKey,
        fileUrl,
        fileName,
        mimeType,
        sizeBytes,
        status: "UPLOADED",
      },
    });

    return res.status(201).json({
      message: "Expense document created successfully.",
      document,
    });
  } catch (error) {
    console.error("Failed to create expense document:", error);

    return res.status(500).json({
      message: "Failed to create expense document.",
    });
  }
}

export const saveExpenseDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params
    
    const { 
      category,
      amount,
      description,
      group,
      notes
     } = req.body

     if (!category && typeof category !== "string") {
      return res.status(400).json({ messsage: "Category is require"})
     }

     if (typeof amount !== "number" && amount < 0) {
      return res.status(400).json({ message: "amount must be a valid positive number"})
     }
    
     const allowedGroups = [
      "CLINICAL",
      "EQUIPMENT_INFRASTRUCTURE",
      "LOGISTICS_OVERHEAD",
     ];

      if (!allowedGroups.includes(group)) {
        return res.status(400).json({ message: "Invalid expense group"})
      }
     
      const document = await prisma.expenseDocument.findUnique({
        where: { documentId },
      });

      if (!document) {
        return res.status(400).json({ message: "Expense document not found."})
      }

      if (!document.expenseId) {
        return res.status(400).json({ message: "This document is already linked to an expense Id."})
      }

      const result = await prisma.$transaction( async (tx) => {
        const expenses = await tx.expenses.create({
          data: {
            category,
            amount,
            description,
            group,
            notes,
            status: "PENDING"
          },
        });

        //we have to create a real expense first then link that real expense to the expense to the doucment expense id feild
        const updatedDocument = await tx.expenseDocument.update({
          where: { documentId },
          data: {
            expenseId: expenses.expenseId,
            status: "SAVED"
          },
        });

        return { 
          expenses,
          document: updatedDocument,
        };
      });
      return res.status(201).json({
        message: "Expense saved successfully from document.",
        expense: result.expenses,
        document: result.document
      });
  } catch (error) {
    console.error("Failed to save expense from document:", error);

    return res.status(500).json({
      message: "Failed to save expense from document.",
    });
  }
}

