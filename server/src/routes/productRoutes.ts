import { Router } from "express";
import { getProducts, createProduct, getProductById, updateProduct } from "../controllers/productConrtoller";
import { must } from "../middleware/auth";
import { PERMS } from "@lab/shared";

const router = Router();

router.get("/", ...must(PERMS.READ_PRODUCTS), getProducts);
router.get("/:productId",...must(PERMS.READ_PRODUCTS), getProductById);
router.put("/:productId",...must(PERMS.WRITE_PRODUCTS), updateProduct);

router.post("/", ...must(PERMS.WRITE_PRODUCTS), createProduct);


export default router;
