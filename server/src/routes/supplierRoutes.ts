import { Router } from "express";
import { getSuppliers } from "../services/supplierAnalytics.service.ts";
import { PERMS } from "@lab/shared"
import { must } from "../middleware/auth"
import { getSupplierSummary } from "../controllers/supplierController";



const router = Router();

router.get("/", getSuppliers);
router.get("/:supplierId/analytics", ...must(PERMS.READ_SUPPLIERS), getSupplierSummary)
export default router;
