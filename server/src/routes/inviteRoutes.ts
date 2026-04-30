import { Router } from "express";
import {
  acceptInvite,
  createInvite,
  getOrganizationInvites,
} from "../controllers/inviteController";
import { must } from "../middleware/auth";
import { PERMS } from "@lab/shared";

const router = Router();

router.post(
  "/organizations/:organizationId",
  ...must(PERMS.WRITE_ORGANIZATIONS),
  createInvite
);

router.get(
  "/organizations/:organizationId",
  ...must(PERMS.READ_ORGANIZATIONS),
  getOrganizationInvites
);

router.post(
  "/accept",
  ...must(PERMS.ACCESS_HOME),
  acceptInvite
);

export default router;