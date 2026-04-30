import { Router } from "express";
import { getSuppliers } from "../controllers/supplierController"
import { PERMS } from "@lab/shared"
import { must } from "../middleware/auth"
import { getSupplierSummary } from "../controllers/supplierController";



const router = Router();

router.get("/",...must(PERMS.READ_SUPPLIERS), getSuppliers);
router.get("/:supplierId/analytics", ...must(PERMS.READ_SUPPLIERS), getSupplierSummary)
export default router;
