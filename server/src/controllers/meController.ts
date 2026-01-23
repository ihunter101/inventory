import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Location } from "@prisma/client";
import { clerkClient } from "@clerk/express";

export const getMe = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth as { userId: string } | undefined;
    const clerkId = auth?.userId;

    if (!clerkId) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const user = await prisma.users.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ AUTO-SYNC: If user is onboarded in DB but Clerk might not know
    if (user.onboardedAt) {
      try {
        const clerkUser = await clerkClient.users.getUser(clerkId);
        const isMarkedComplete = clerkUser.publicMetadata?.onboardingComplete === true;
        
        if (!isMarkedComplete) {
          console.log("🔄 Auto-syncing Clerk metadata for:", user.email);
          await clerkClient.users.updateUserMetadata(clerkId, {
            publicMetadata: {
              onboardingComplete: true,
            }
          });
          console.log("✅ Metadata synced");
        }
      } catch (error) {
        console.error("⚠️ Metadata sync failed (non-critical):", error);
      }
    }


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

    const { name, location } = req.body as { name?: string; location: string };

    if (typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters" });
    }

    if (typeof location !== "string" || location.trim().length < 2) {
      return res.status(400).json({ error: "Location is required" });
    }

    const existing = await prisma.users.findUnique({
      where: { clerkId }
    });

    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }

    const loc = location as Location;

    // If already onboarded, just ensure Clerk is synced
    if (existing.onboardedAt) {
      console.log("User already onboarded, ensuring Clerk sync...");
      
      try {
        await clerkClient.users.updateUserMetadata(clerkId, {
          publicMetadata: {
            onboardingComplete: true,
          }
        });
        
        // Small delay to ensure propagation
        await new Promise(resolve => setTimeout(resolve, 300));
        
        console.log("✅ Clerk metadata synced");
      } catch (clerkError) {
        console.error("❌ Clerk sync failed:", clerkError);
      }

      return res.json(existing);
    }

    // First-time onboarding
    const updated = await prisma.users.update({
      where: { clerkId },
      data: {
        name: name.trim(),
        location: loc,
        onboardedAt: new Date(),
      }
    });

    // Update Clerk metadata
    try {
      await clerkClient.users.updateUserMetadata(clerkId, {
        publicMetadata: {
          onboardingComplete: true,
        }
      });
      
      // Small delay to ensure propagation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log("✅ User onboarded and Clerk updated:", updated.email);
    } catch (clerkError) {
      console.error("❌ Clerk update failed:", clerkError);
      // Still return success since DB is updated
    }

    return res.json(updated);
  } catch (error) {
    console.error("❌ Onboarding error:", error);
    return res.status(500).json({ error: "Failed to update user" });
  }
};