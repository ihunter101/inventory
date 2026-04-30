import { Router } from "express";
import {
  getClientDashboard,
  getClientInvoices,
  getClientInvoiceById,
} from "../controllers/clientPortalController";

import { must } from "../middleware/auth";
import { PERMS } from "@lab/shared";

const router = Router();

router.get(
  "/dashboard",
  //...must(PERMS.READ_CLIENT_PORTAL),
  ...must(PERMS.READ_CLIENT_PORTAL),
  getClientDashboard
);

router.get(
  "/invoices",
  //...must(PERMS.READ_CLIENT_PORTAL),
  ...must(PERMS.READ_CLIENT_INVOICES,),
  getClientInvoices
);

router.get(
  "/invoices/:invoiceId",
//   ...must(PERMS.READ_CLIENT_PORTAL),
...must(PERMS.READ_CLIENT_INVOICES),
  getClientInvoiceById
);

export default router;