// src/controllers/draftProductController.ts
import { Request, Response } from "express";
import { prisma } from "../lib/prisma"; // adjust import

export const listDraftProducts = async (_req: Request, res: Response) => {
  try {
    const drafts = await prisma.draftProduct.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, unit: true },
    });
    return res.json(drafts);
  } catch (err) {
    console.error("listDraftProducts error:", err);
    return res.status(500).json({ message: "Error fetching draft products." });
  }
};

export const createDraftProduct = async (req: Request, res: Response) => {
  try {
    const name = String(req.body.name).trim();
    const unit = (req.body.unit ?? "").toString().trim(); // normalize null -> ""

    const existing = await prisma.draftProduct.findFirst({
      where: { name, unit },
      });

    const draft = existing
      ? existing
      : await prisma.draftProduct.create({
        data: { name, unit },
      });


    return res.status(201).json(draft);
  } catch (e) {
    console.error("createDraftProduct error:", e);
    return res.status(500).json({ message: "Error creating draft product" });
  }
};
