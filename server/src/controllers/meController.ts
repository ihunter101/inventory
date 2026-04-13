import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Location } from "@prisma/client";
import { clerkClient } from "@clerk/express";
import  resend  from "../config/resend";
import { buildNewUserEmail } from "../emails/newUserNotification";

export const getMe = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth as { userId: string } | undefined;
    const clerkId = auth?.userId;

    if (!clerkId) return res.status(401).json({ error: "Unauthenticated" });

    const user = await prisma.users.findUnique({ where: { clerkId } });

    if (!user) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({
      user: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        role: user.role,
        location: user.location,
        onboardedAt: user.onboardedAt,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        accessStatus: user.accessStatus,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
};


export const onboarding = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth as { userId: string } | undefined;
    const clerkId = auth?.userId;

    if (!clerkId) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const { name, location } = req.body as {
      name?: string;
      location: string;
    };

    if (
      name !== undefined &&
      (typeof name !== "string" || name.trim().length < 2)
    ) {
      return res.status(400).json({ error: "Name must be at least 2 characters" });
    }

    if (typeof location !== "string" || location.trim().length < 2) {
      return res.status(400).json({ error: "Location is required" });
    }

    const existing = await prisma.users.findUnique({
      where: { clerkId },
    });

    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }

    if (existing.onboardedAt) {
      try {
        await clerkClient.users.updateUserMetadata(clerkId, {
          publicMetadata: { onboardingComplete: true },
        });
      } catch (clerkError) {
        console.error("❌ Clerk sync failed:", clerkError);
      }

      return res.json(existing);
    }

    const updated = await prisma.users.update({
      where: { clerkId },
      data: {
        name: name ? name.trim() : existing.name,
        location: location as Location,
        onboardedAt: new Date(),
      },
    });

    try {
      await clerkClient.users.updateUserMetadata(clerkId, {
        publicMetadata: { onboardingComplete: true },
      });
    } catch (clerkError) {
      console.error("❌ Clerk update failed:", clerkError);
    }

    return res.json(updated);
  } catch (error) {
    console.error("❌ Onboarding error:", error);
    return res.status(500).json({ error: "Failed to update user" });
  }
};

