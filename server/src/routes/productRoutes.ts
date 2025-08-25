import { Router } from "express";
import { getProducts, createProduct } from "../controllers/productConrtoller";

const router = Router();

router.get("/", getProducts)
router.post("/", createProduct)

export default router;