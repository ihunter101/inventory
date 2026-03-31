import { Router } from "express";
import { deleteUser, getMe, getUserById, getUsers, reviewUserAccess, updateUser, updateUserRole } from "../controllers/userController";
import { must } from "../middleware/auth";
import { PERMS } from "@lab/shared";
import { requireAuth } from "@clerk/express";

const router = Router();

// /me must be before /:id or it gets swallowed
router.get("/me", requireAuth(), getMe);
router.get("/", ...must(PERMS.READ_USERS), getUsers);
router.get("/:id", ...must(PERMS.READ_USERS), getUserById);
router.patch("/:id", ...must(PERMS.WRITE_USERS), updateUser);
router.patch("/:id/review", requireAuth(), reviewUserAccess);
router.patch("/:id/role",...must(PERMS.WRITE_USERS), updateUserRole);
router.delete("/:id",    ...must(PERMS.WRITE_USERS), deleteUser);

export default router;