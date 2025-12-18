import { Router } from "express";
import { getUsers } from "../controllers/userController";
import { must } from "../middleware/auth";
import { PERMS } from "@lab/shared";

const router = Router();

router.get("/", ...must(PERMS.READ_USERS),getUsers);

export default router
