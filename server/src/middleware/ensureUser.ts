import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { clerkClient, getAuth } from "@clerk/express";

export function ensureUser() {
  return [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { userId } = getAuth(req);

        if (!userId) {
          return res.status(401).json({ error: "Unauthenticated" });
        }

        const clerkUser = await clerkClient.users.getUser(userId);

        const email = 
          clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress
          ?? clerkUser.emailAddresses[0]?.emailAddress;

        if (!email) {
          return res.status(400).json({ error: "No email address found" });
        }

        const name = 
          [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") 
          || clerkUser.username 
          || "Unknown User";

        // ✅ Check by clerkId first
        let dbUser = await prisma.users.findUnique({
          where: { clerkId: userId }
        });

        if (dbUser) {
          // ✅ Update existing user (but DON'T update email - it's immutable)
          dbUser = await prisma.users.update({
            where: { clerkId: userId },
            data: {
              name,
              lastLogin: new Date()
            }
          });
        } else {
          // No user found by clerkId - check if email exists
          const existingUser = await prisma.users.findUnique({
            where: { email }
          });

          if (existingUser) {
            // Email exists but has no clerkId - link them
            dbUser = await prisma.users.update({
              where: { email },
              data: {
                clerkId: userId,
                name,
                lastLogin: new Date()
              }
            });
          } else {
            // Create new user
            dbUser = await prisma.users.create({
              data: {
                clerkId: userId,
                email,
                name,
                role: "viewer",
                location: "other",
                lastLogin: new Date()
              }
            });
          }
        }

        (req as any).user = dbUser;
        return next();

      } catch (error: any) {
        console.error("[ensureUser] error:", error);
        return res.status(500).json({ error: "Authentication failed" });
      }
    }
  ];
}