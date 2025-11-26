import { Request, Response } from "express"
import { prisma } from "../lib/prisma";
//const prisma = new PrismaClient();

export const getSuppliers = async (req: Request, res: Response) => {
   try {
    const suppliers = await prisma.supplier.findMany({
        orderBy: {
            name: "asc"
        }, 
    }) 
    res.json(suppliers)
   } catch (error) {
    res.status(500).json({ message: "Error getting Suppliers "})
   }
}