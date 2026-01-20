import { Router } from "express";
import { deleteUser, getMe, getUserById, getUsers, updateUser, updateUserRole } from "../controllers/userController";
import { must } from "../middleware/auth";
import { PERMS } from "@lab/shared";

const router = Router();

router.get("/me", getMe)
router.get("/", ...must(PERMS.READ_USERS),getUsers);
router.get("/:id",...must(PERMS.READ_USERS), getUserById);
router.patch('/:id', ...must(PERMS.WRITE_USERS),updateUser);
router.patch("/:id/role", ...must(PERMS.WRITE_USERS), updateUserRole);
router.delete("/:id", ...must(PERMS.WRITE_USERS), deleteUser);
router.get("/me", getMe)

export default router
