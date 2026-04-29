import { Router } from "express";
import {
  getOrganizations,
  getAvailableOrganizationCustomers,
  createOrganization,
  getOrganizationById,
} from "../controllers/organizationController";

import { must } from "../middleware/auth";
import { PERMS } from "@lab/shared";

const router = Router();

router.get(
  "/",
  ...must(PERMS.READ_ORGANIZATIONS),
  getOrganizations
);

router.get(
  "/available-customers",
  ...must(PERMS.READ_ORGANIZATIONS),
  getAvailableOrganizationCustomers
);

router.post(
  "/",
  ...must(PERMS.WRITE_ORGANIZATIONS),
  createOrganization
);

router.get(
  "/:organizationId",
  ...must(PERMS.READ_ORGANIZATIONS),
  getOrganizationById
);

export default router;