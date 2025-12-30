// server/src/middleware/auth.ts
import { requireAuth, clerkClient } from "@clerk/express";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { hasPerm, Role, type Perm } from "@lab/shared";
import { prisma } from "../lib/prisma";

// const prisma = new PrismaClient();

function getClientIp(req: Request) {
  const ip = req.headers["x-forwarded-for"] 
  const raw = Array.isArray(ip) ? ip[0] : ip;
  return (raw?.split(",")[0] ?? req.ip)?.trim();
}

const ORG_ID = process.env.CLERK_PRIMARY_ORG_ID!;

// Auto-join the single org (safe to call every time)
async function ensureOrgMembership(userId: string, orgId: string) {
  const page = await clerkClient.organizations.getOrganizationMembershipList({
    organizationId: orgId,
    limit: 100,
  });
  const already = page.data.some((m) => m.publicUserData?.userId === userId);
  if (!already) {
    await clerkClient.organizations.createOrganizationMembership({
      organizationId: orgId,
      userId,
      role: "admin", // or whatever default you want new members to have
    });
  }
}

// matches your JWT template


export function must(perm: Perm): RequestHandler[] {
  return [
    requireAuth(),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const auth = (req as any).auth  as { userId?: string } | undefined;
        const clerkId = auth?.userId;

        

        if (!clerkId) {
          return res.status(401).json({ error: "Unauthenticated" });
        }


        // Get the user from database to check their role
        const user = await prisma.users.findUnique({
          where: { clerkId }
        });

        if (!user || !user.role) {
          return res.status(401).json({ error: "User not found or no role assigned" });
        }

        // Check if user has the required permission
        const hasPermission = hasPerm(user.role as Role, perm);
        
        if (!hasPermission) {
          return res.status(403).json({ error: "Insufficient permissions" });
        }

        // Optionally attach user to request for downstream use
        (req as any).user = user;
        
        return next();
      } catch (error) {
        console.error("[must] error:", error);
        return res.status(500).json({ error: "Authorization check failed" });
      }
    },
  ];
}
