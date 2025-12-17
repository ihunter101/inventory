"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProduct = exports.getProducts = void 0;
const stock_1 = require("../utils/stock");
const prisma_1 = require("../lib/prisma");
const zod_1 = require("zod");
//const prisma = new PrismaClient()
const querySchema = zod_1.z.object({
    search: zod_1.z.string().min(1).optional(),
    department: zod_1.z.string().min(1).optional(),
    page: zod_1.z.coerce.number().min(1).default(1),
});
const getProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1) validate + coerce query
        const { search, page, department } = querySchema.parse(req.query);
        // 2) build where
        const where = Object.assign(Object.assign({}, (search && {
            name: { contains: search, mode: "insensitive" },
        })), (department && department !== "all" && { department }));
        // 3) pagination
        const PAGE_SIZE = 20;
        const skip = (page - 1) * PAGE_SIZE;
        const [products, totalItems] = yield Promise.all([
            prisma_1.prisma.products.findMany({
                where,
                skip,
                take: PAGE_SIZE,
                orderBy: { createdAt: "desc" },
            }),
            prisma_1.prisma.products.count({ where }),
        ]);
        const totalPages = Math.ceil(totalItems / PAGE_SIZE);
        // 4) map status, but keep meta OUTSIDE the list
        const items = products.map((p) => (Object.assign(Object.assign({}, p), { status: (0, stock_1.getStatus)(p.stockQuantity, p.minQuantity, p.reorderPoint) })));
        res.json({
            items,
            page,
            totalPages,
            pageSize: PAGE_SIZE,
            totalItems,
            hasNextPage: page < totalPages,
            previousPage: page > 1 ? page - 1 : null,
        });
    }
    catch (error) {
        console.error("Error retrieving products:", error);
        res.status(500).json({ message: "Error retrieving items" });
    }
});
exports.getProducts = getProducts;
const createProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productId, name, 
        //price,
        stockQuantity, rating, supplier, minQuantity, 
        //reorderPoint,
        unit, category, expiryDate, imageUrl } = req.body;
        // Validation (you can extend this)
        if (!name || stockQuantity === undefined) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const product = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const newProduct = yield tx.products.create({
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
            });
            yield tx.inventory.create({
                data: {
                    productId: newProduct.productId,
                    stockQuantity,
                    minQuantity,
                    //reorderPoint,
                }
            });
            // re-read with relation
            //const productWithInventory = await tx.products.findUnique({
            // where: { productId: newProduct.productId },
            // include: { inventory: true },
            //});
            return newProduct;
            // return productWithInventory;
        }));
        return res.status(201).json(product);
    }
    catch (error) {
        console.error("Create product error:", error);
        return res.status(500).json({ error: "Failed to create product" });
    }
});
exports.createProduct = createProduct;
