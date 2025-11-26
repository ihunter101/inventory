"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("@shared/rbac");
const router = (0, express_1.Router)();
router.get("/", ...(0, auth_1.must)(rbac_1.PERMS.READ_USERS), userController_1.getUsers);
exports.default = router;
