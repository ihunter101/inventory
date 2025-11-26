"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.must = must;
// server/src/middleware/auth.ts
const express_1 = require("@clerk/express");
const rbac_1 = require("@shared/rbac");
const prisma_1 = require("../lib/prisma");
// const prisma = new PrismaClient();
const ORG_ID = process.env.CLERK_PRIMARY_ORG_ID;
// Auto-join the single org (safe to call every time)
function ensureOrgMembership(userId, orgId) {
    return __awaiter(this, void 0, void 0, function* () {
        const page = yield express_1.clerkClient.organizations.getOrganizationMembershipList({
            organizationId: orgId,
            limit: 100,
        });
        const already = page.data.some((m) => { var _a; return ((_a = m.publicUserData) === null || _a === void 0 ? void 0 : _a.userId) === userId; });
        if (!already) {
            yield express_1.clerkClient.organizations.createOrganizationMembership({
                organizationId: orgId,
                userId,
                role: "admin", // or whatever default you want new members to have
            });
        }
    });
}
function must(perm) {
    return [
        (0, express_1.requireAuth)(),
        (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const auth = req.auth;
                if (!(auth === null || auth === void 0 ? void 0 : auth.userId))
                    return res.status(401).json({ error: "Unauthorized" });
                // Get the user from database to check their role
                const user = yield prisma_1.prisma.users.findUnique({
                    where: { clerkId: auth.userId }
                });
                if (!user || !user.role) {
                    return res.status(401).json({ error: "User not found or no role assigned" });
                }
                // Check if user has the required permission
                const hasPermission = (0, rbac_1.hasPerm)(user.role, perm);
                if (!hasPermission) {
                    return res.status(403).json({ error: "Insufficient permissions" });
                }
                // Optionally attach user to request for downstream use
                req.user = user;
                return next();
            }
            catch (error) {
                console.error("[must] error:", error);
                return res.status(500).json({ error: "Authorization check failed" });
            }
        }),
    ];
}
