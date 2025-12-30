import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Location } from "@prisma/client";

export const getMe = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth as { userId: string } | undefined;
    const clerkId = auth?.userId;

    if (!clerkId) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    // User should exist because ensureUser middleware runs first
    const user = await prisma.users.findUnique({
      where: { clerkId }
    });

    if (!user) {
      // This shouldn't happen if ensureUser ran, but just in case
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
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

    // Validate inputs
    if (typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters" });
    }

    if (typeof location !== "string" || location.trim().length < 2) {
      return res.status(400).json({ error: "Location is required" });
    }

    // User should exist because ensureUser middleware runs first
    const existing = await prisma.users.findUnique({
      where: { clerkId }
    });

    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already onboarded
    if (existing.onboardedAt) {
      console.log("User already onboarded, returning existing data");
      return res.json(existing);
    }

    const loc = location as Location;

    // Complete onboarding
    const updated = await prisma.users.update({
      where: { clerkId },
      data: {
        name: name.trim(),
        location: loc,
        onboardedAt: new Date(),
      }
    });

    console.log("User onboarded successfully:", updated.email);
    return res.json(updated);
  } catch (error) {
    console.error("Error in onboarding:", error);
    return res.status(500).json({ error: "Failed to update user" });
  }
};