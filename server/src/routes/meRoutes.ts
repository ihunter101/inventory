import { Router } from 'express';
import { must } from '../middleware/auth'
import { PERMS } from "@lab/shared";
import { getMe, onboarding } from '../controllers/meController';

const router = Router();

router.get("/", getMe);
router.patch("/",onboarding);

export default router;