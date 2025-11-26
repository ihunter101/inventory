import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

import { getAuth } from "@clerk/express";

//const prisma = new PrismaClient();

export function ensureUser () {
  return [
    async (req:Request, res: Response, next: NextFunction) => {
      try {
        const auth= (req as any).auth?.() ?? getAuth(req);
        const clerkId = auth.userId;
        const claims = (auth?.sessionClaims || {}) as any
        const email = claims.email ?? "";
        const name = claims.name ?? "";
      
        if (!clerkId) return res.status(401).json({ error: "Unauthenticated" });

        // 1.) Check if user exists by clerkId
        const existingByClerk = await prisma.users.findUnique({where: {clerkId}})
        if (existingByClerk) return next();

        // 2.) Always use upsert with email (even if empty)
        await prisma.users.upsert({
          where: { 
            email: email || `no-email-${clerkId}@temp.local` // Use unique fallback email
          },
          update: { clerkId }, // If user exists, just update clerkId
          create: { // If user doesn't exist, create new one
            clerkId,
            email: email || `no-email-${clerkId}@temp.local`, // Use unique fallback email
            name,
            role: "admin",
            location: "other"
          }
        });
        
        return next();
      } catch (error: any) {
        console.log("[ensureUser] error:", error);
        return res.status(500).json({ error: "ensureUser Failed" });
      }
    }
  ]
}