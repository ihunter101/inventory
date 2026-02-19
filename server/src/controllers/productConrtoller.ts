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
export const getProductById = async (req: Request, res: Response) => {
  try {
    const productId = String(req.params.productId || "").trim();
    if (!productId) return res.status(400).json({ message: "productId is required" });

    const p = await prisma.products.findUnique({
      where: { productId },
    });

    if (!p) return res.status(404).json({ message: "Product not found." });

    return res.json({
      productId: p.productId,
      name: p.name,
      rating: p.rating ?? null,
      stockQuantity: p.stockQuantity,
      minQuantity: p.minQuantity ?? null,
      reorderPoint: p.reorderPoint ?? null,
      category: p.category ?? null,
      unit: p.unit ?? null,
      supplier: p.supplier ?? null,
      expiryDate: p.expiryDate ? p.expiryDate.toISOString() : null,
      imageUrl: p.imageUrl ?? null,
      Department: p.Department ?? null,
      sku: p.sku ?? null,
      createdAt: p.createdAt ? p.createdAt.toISOString() : null,
      updatedAt: p.updatedAt ? p.updatedAt.toISOString() : null,
      // price: p.price, // only if exists in Prisma
    });
  } catch (error: any) {
    console.error("getProductById error:", error);
    return res.status(500).json({ message: "Error retrieving product." });
  }
};

const CATEGORY_OPTIONS = ["Collection", "Equipment", "Reagent", "Safety"] as const;
const DEPARTMENT_OPTIONS = [
  "Administration",
  "SpecimenCollection",
  "heamatology",
  "Chemistry",
  "Offlines",
  "Cytology",
  "Bacteriology",
  "SpecialChemistry",
] as const;

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const productId = String(req.params.productId || "").trim();
    if (!productId) return res.status(400).json({ message: "productId is required" });

    const body = req.body ?? {};

    // Build a Prisma-safe update object (only set fields that were provided)
    const data: any = {};

    if (typeof body.name === "string") data.name = body.name.trim();

    if (body.rating !== undefined) {
      const r = body.rating === null ? null : Number(body.rating);
      if (r !== null && (!Number.isFinite(r) || r < 0 || r > 5)) {
        return res.status(400).json({ message: "rating must be between 0 and 5." });
      }
      data.rating = r;
    }

    if (body.stockQuantity !== undefined) {
      const v = Number(body.stockQuantity);
      if (!Number.isFinite(v) || v < 0) {
        return res.status(400).json({ message: "stockQuantity must be a non-negative number." });
      }
      data.stockQuantity = Math.trunc(v);
    }

    if (body.minQuantity !== undefined) {
      const v = body.minQuantity === null ? null : Number(body.minQuantity);
      if (v !== null && (!Number.isFinite(v) || v < 0)) {
        return res.status(400).json({ message: "minQuantity must be non-negative." });
      }
      data.minQuantity = v === null ? null : Math.trunc(v);
    }

    if (body.reorderPoint !== undefined) {
      const v = body.reorderPoint === null ? null : Number(body.reorderPoint);
      if (v !== null && (!Number.isFinite(v) || v < 0)) {
        return res.status(400).json({ message: "reorderPoint must be non-negative." });
      }
      data.reorderPoint = v === null ? null : Math.trunc(v);
    }

    if (body.category !== undefined) {
      const c = body.category === null ? null : String(body.category);
      if (c !== null && !CATEGORY_OPTIONS.includes(c as any)) {
        return res.status(400).json({ message: "Invalid category." });
      }
      data.category = c;
    }

    if (body.unit !== undefined) data.unit = body.unit === null ? null : String(body.unit);
    if (body.supplier !== undefined) data.supplier = body.supplier === null ? null : String(body.supplier);
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl === null ? null : String(body.imageUrl);
    
    if (body.Department !== undefined) {
      const dep = body.Department === null ? null : String(body.Department);
      if (dep !== null && !DEPARTMENT_OPTIONS.includes(dep as any)) {
        return res.status(400).json({ message: "Invalid Department." });
      }
      data.Department = dep;
    }

    if (body.sku !== undefined) {
      const sku = body.sku === null ? null : String(body.sku).trim();
      data.sku = sku || null;
    }

    if (body.expiryDate !== undefined) {
      if (body.expiryDate === null || body.expiryDate === "") {
        data.expiryDate = null;
      } else {
        const dt = new Date(body.expiryDate);
        if (isNaN(dt.getTime())) {
          return res.status(400).json({ message: "Invalid expiryDate." });
        }
        data.expiryDate = dt;
      }
    }

    // If nothing to update
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "No valid fields provided to update." });
    }

    const updated = await prisma.products.update({
      where: { productId },
      data,
    });

    return res.json({
      productId: updated.productId,
      name: updated.name,
      rating: updated.rating ?? null,
      stockQuantity: updated.stockQuantity,
      minQuantity: updated.minQuantity ?? null,
      reorderPoint: updated.reorderPoint ?? null,
      category: updated.category ?? null,
      unit: updated.unit ?? null,
      supplier: updated.supplier ?? null,
      expiryDate: updated.expiryDate ? updated.expiryDate.toISOString() : null,
      imageUrl: updated.imageUrl ?? null,
      Department: updated.Department ?? null,
      sku: updated.sku ?? null,
      createdAt: updated.createdAt ? updated.createdAt.toISOString() : null,
      updatedAt: updated.updatedAt ? updated.updatedAt.toISOString() : null,
    });
  } catch (error: any) {
    console.error("updateProduct error:", error);

    if (error?.code === "P2025") {
      return res.status(404).json({ message: "Product not found." });
    }
    if (error?.code === "P2002") {
      return res.status(409).json({ message: "Duplicate unique field (e.g. sku).", meta: error.meta });
    }

    return res.status(500).json({ message: "Error updating product.", debug: error?.message });
  }
};






