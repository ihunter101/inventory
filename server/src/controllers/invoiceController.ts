import { Request, Response } from "express";
import {  InvoiceStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

//const prisma = new PrismaClient();

/** Frontend-friendly mapper: flatten supplier, coerce Decimals/Dates, map line fields */
function toInvoiceDTO(inv: any) {
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    supplierId: inv.supplierId,
    supplier: inv.supplier?.name ?? undefined, // FE expects string
    poId: inv.poId ?? undefined,
    status: inv.status as InvoiceStatus,       // "PENDING" | "PAID" | "OVERDUE"
    date: inv.date instanceof Date ? inv.date.toISOString() : inv.date,
    dueDate: inv.dueDate
      ? inv.dueDate instanceof Date
        ? inv.dueDate.toISOString()
        : inv.dueDate
      : undefined,
    lines: (inv.items ?? []).map((it: any) => ({
      draftProductId: it.draftProductId,
      productId: it.productId || null,
      sku: undefined,                          // optional on FE
      name: it.draftProduct?.name ?? it.name,   // FE uses "name"
      unit: it.uom ?? it.unit ?? "",           // schema uses "uom"; tolerate "unit"
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
      lineTotal: Number(it.lineTotal),
    })),
    amount: Number(inv.amount),
  };
}

export const listInvoices = async (req: Request, res: Response) => {
  try {
    const { status, q } = req.query as Partial<{ status: string; q: string }>;
    const where: any = {};

    // Validate/normalize status
    if (status && ["PENDING", "PAID", "OVERDUE"].includes(status)) {
      where.status = status as InvoiceStatus;
    }

    if (q && q.trim()) {
      where.OR = [
        { invoiceNumber: { contains: q, mode: "insensitive" } },
        { supplier: { is: { name: { contains: q, mode: "insensitive" } } } },
      ];
    }

    const rows = await prisma.supplierInvoice.findMany({
      where,
      include: { 
        supplier: true, 
        items: {
          include: {
            draftProduct: true, 
            product: true,
          }
        }
        , 
        po: true },
      orderBy: { date: "desc" },
    });

    return res.json(rows.map(toInvoiceDTO));
  } catch (error) {
    console.error("listInvoices error:", error);
    res.status(500).json({ message: "Error retrieving supplier invoices." });
  }
};

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const { invoiceNumber, supplierId, poId, date, dueDate, lines = [] } = req.body;

    if (!invoiceNumber || !supplierId || !Array.isArray(lines) || lines.length === 0) {
      return res
        .status(400)
        .json({ error: "invoiceNumber, supplierId and non-empty line items are required" });
    }

    const amount = lines.reduce(
      (s: number, l: any) => s + Number(l.quantity) * Number(l.unitPrice),
      0
    );

    console.log("REQ BODY:", req.body);
    console.log("LINES TYPE:", Array.isArray(lines), lines);

    const created = await prisma.supplierInvoice.create({
      data: {
        invoiceNumber,
        supplierId,
        poId: poId ?? null,
        date: date ? new Date(date) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        status: "PENDING",
        amount,
        items: {
          create: lines.map((line: any) => ({
            //productId: line.productId || null,
            draftProduct: {
              connect: { id: line.draftProductId },
            },
            description: line.description ?? line.name ?? "",
            // schema field is "uom"
            uom: line.unit ?? line.uom ?? "",
            quantity: Number(line.quantity),
            unitPrice: Number(line.unitPrice),
            lineTotal: Number(line.quantity) * Number(line.unitPrice),
          })),
        },
      },
      include: { 
        supplier: true, 
        items: { include: { 
          draftProduct: true,
          product: true,
        } }, 
        po: true },

        //orderBy: { date: "desc" }
    }
    
  );

    console.log("REQ BODY:", req.body);
    console.log("LINES TYPE:", Array.isArray(lines), lines);


    return res.status(201).json(toInvoiceDTO(created));
  } catch (error) {
    console.error("createInvoice error:", error);
    res.status(500).json({ message: "Error creating supplier invoice." });
  }
};

export const markInvoicePaid = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // If you want to accept a status or paidDate from FE, read them here:
    // const { status, paidDate } = req.body;
    const updated = await prisma.supplierInvoice.update({
      where: { id },
      data: { status: "PAID" },
      include: { supplier: true, items: true, po: true },
    });
    return res.json(toInvoiceDTO(updated));
  } catch (error) {
    console.error("markInvoicePaid error:", error);
    res.status(500).json({ message: "Error updating invoice." });
  }
};
