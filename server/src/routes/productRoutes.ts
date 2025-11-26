import { Router } from "express";
import { getProducts, createProduct } from "../controllers/productConrtoller";
import { must } from "../middleware/auth";
import { PERMS } from "@shared/rbac";

const router = Router();

router.get("/", ...must(PERMS.READ_PRODUCTS), getProducts)
router.post("/", ...must(PERMS.WRITE_PRODUCTS), createProduct)

export default router;