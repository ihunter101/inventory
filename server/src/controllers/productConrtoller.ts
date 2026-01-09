import { Request, Response } from "express";
import { Department, Prisma } from "@prisma/client";
import { getStatus } from '../utils/stock';
import { prisma } from "../lib/prisma";

import { z } from "zod"

//const prisma = new PrismaClient()

const querySchema = z.object({
  search: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  page: z.coerce.number().min(1).default(1),
});

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1) validate + coerce query
    const { search, page, department } = querySchema.parse(req.query);

    // 2) build where
    const where: Prisma.ProductsWhereInput = {
      ...(search && {
        name: { contains: search, mode: "insensitive" as const },
      }),
      ...(department && department !== "all" && { department }),
    };

    // 3) pagination
    const PAGE_SIZE = 20;
    const skip = (page - 1) * PAGE_SIZE;

    const [products, totalItems] = await Promise.all([
      prisma.products.findMany({
        where,
        skip,
        take: PAGE_SIZE,
        orderBy: { createdAt: "desc" },
      }),
      prisma.products.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / PAGE_SIZE);

    // 4) map status, but keep meta OUTSIDE the list
    const items = products.map((p) => ({
      ...p,
      status: getStatus(
        p.stockQuantity,
        (p as any).minQuantity,
        (p as any).reorderPoint
      ),
    }));

    res.json({
      items,
      page,
      totalPages,
      pageSize: PAGE_SIZE,
      totalItems,
      hasNextPage: page < totalPages,
      previousPage: page > 1 ? page - 1 : null,
    });
  } catch (error) {
    console.error("Error retrieving products:", error);
    res.status(500).json({ message: "Error retrieving items" });
  }
};


export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      productId,
      name,
      //price,
      stockQuantity,
      rating,
      supplier,
      minQuantity,
      //reorderPoint,
      unit,
      category,
      expiryDate,
      imageUrl
    } = req.body;

    // Validation (you can extend this)
    if (!name || stockQuantity === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }


    const product = await prisma.$transaction( async (tx) => {
      const newProduct = await tx.products.create({
        data: {
        productId,
        name,
        stockQuantity: parseInt(stockQuantity),
        rating: rating ? parseFloat(rating) : undefined,
        supplier,
        minQuantity: minQuantity ? parseInt(minQuantity) : undefined,
        unit,
        category,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        imageUrl,

      },
      })
      await tx.inventory.create({
        data: {
          productId: newProduct.productId,
          stockQuantity,
          minQuantity,
          //reorderPoint,
        }
      })
 // re-read with relation
      //const productWithInventory = await tx.products.findUnique({
       // where: { productId: newProduct.productId },
       // include: { inventory: true },
      //});
      return newProduct
     // return productWithInventory;
    })
    return res.status(201).json(product);
  } catch (error) {
    console.error("Create product error:", error);
    return res.status(500).json({ error: "Failed to create product" });
  }
}

export const getPendingArrivals = async (req: Request, res: Response) => {
  try {
    const products = await prisma.products.findMany({
      where: {
        OR: [
          { category: null },
          { Department: null },
          { imageUrl: null},
        ]
      },
      orderBy: { createdAt: "desc"},
    });
    return res.json(products)
  } catch (error) {
    console.error("Error retrieving products:", error);
    return res.status(500).json({ message: "Error retrieving items" });
  }
}




