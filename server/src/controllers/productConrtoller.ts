//controller defines the logic of what happens when a route  requested

import { Request, Response } from "express";
// Request is a type that represent the incoming HTTP request (URL, Header, body, query parameters)
// Response is a type that represents the data that is sent back from the database 

import { PrismaClient } from "@prisma/client"
import { getStatus } from '../utils/stock';

const prisma = new PrismaClient()

// define a function called get products
    // 1.) when the /products URL is reached, it checks the URL for the search terms (e.g. /products?search=gloves)
    // 2.) ask prisma to find that row where that item is 
    // 3.) display it to the frontend for the user.

export const getProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const search = req.query.search?.toString()
         const where = search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {};

    const products = await prisma.products.findMany({ where });

    const result = products.map((p) =>({
        ...p,
        stauts: getStatus(
            p.stockQuantity,
            (p as any).minQuantity,
            (p as any).reorderPoint
        ),
    }))
    res.json(result)
    } catch (error) {
        res.status(500).json({ message: "Error retrieving items"})
    }
}


export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      productId,
      name,
      price,
      stockQuantity,
      rating,
      supplier,
      minQuantity,
      unit,
      category,
      expiryDate,
    } = req.body;

    // Validation (you can extend this)
    if (!name || price === undefined || stockQuantity === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newProduct = await prisma.products.create({
      data: {
        productId,
        name,
        price: parseFloat(price),
        stockQuantity: parseInt(stockQuantity),
        rating: rating ? parseFloat(rating) : undefined,
        supplier,
        minQuantity: minQuantity ? parseInt(minQuantity) : undefined,
        unit,
        category,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      },
    });

    return res.status(201).json(newProduct);
  } catch (error) {
    console.error("Create product error:", error);
    return res.status(500).json({ error: "Failed to create product" });
  }
}





// Inside req, there are different “buckets” of info:
// req.body → data mainly coming from post/put request where the client is sending information to the database (like form data or JSON).
// req.params → route parameters (e.g. /products/:id → req.params.id).
// req.query → query string parameters (the ?key=value part of the URL).
// req.headers, req.cookies, etc. → other metadata.

// /products?search=gloves&sort=price
// req.query = {
//   search: "gloves",
//   sort: "price"
// }
// so req.search = gloves and req.sort = price

// the products variable contains information fetched by te database
    // prisma.products.findMany states
        // go to the products table and use the findMany function to return all products 
        // where: tells prisma to filter through every row 
        // name: contains: search 
            // tells prisma to go the name column in the table and find all products where te products name match the search (query) string value
