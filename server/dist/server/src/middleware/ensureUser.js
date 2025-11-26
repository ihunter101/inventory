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
exports.ensureUser = ensureUser;
const prisma_1 = require("../lib/prisma");
const express_1 = require("@clerk/express");
//const prisma = new PrismaClient();
function ensureUser() {
    return [
        (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            try {
                const auth = (_c = (_b = (_a = req).auth) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : (0, express_1.getAuth)(req);
                const clerkId = auth.userId;
                const claims = ((auth === null || auth === void 0 ? void 0 : auth.sessionClaims) || {});
                const email = (_d = claims.email) !== null && _d !== void 0 ? _d : "";
                const name = (_e = claims.name) !== null && _e !== void 0 ? _e : "";
                if (!clerkId)
                    return res.status(401).json({ error: "Unauthenticated" });
                // 1.) Check if user exists by clerkId
                const existingByClerk = yield prisma_1.prisma.users.findUnique({ where: { clerkId } });
                if (existingByClerk)
                    return next();
                // 2.) Always use upsert with email (even if empty)
                yield prisma_1.prisma.users.upsert({
                    where: {
                        email: email || `no-email-${clerkId}@temp.local` // Use unique fallback email
                    },
                    update: { clerkId }, // If user exists, just update clerkId
                    create: {
                        clerkId,
                        email: email || `no-email-${clerkId}@temp.local`, // Use unique fallback email
                        name,
                        role: "admin",
                        location: "other"
                    }
                });
                return next();
            }
            catch (error) {
                console.log("[ensureUser] error:", error);
                return res.status(500).json({ error: "ensureUser Failed" });
            }
        })
    ];
}
