import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Role, canModifyUserRole, ROLE_HIERARCHY } from "@lab/shared/userRolesUtils";
import { verifyApprovalToken } from "../lib/approvalToken";
import resend from "../config/resend"
import { buildAccessDecisionEmail } from "../emails/accessDecisionEmail";


//const prisma = new PrismaClient();

export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await prisma.users.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                location: true,
                createdAt: true,
                lastLogin: true,
                onboardedAt: true,
                clerkId: true,
            },
            orderBy: {
                onboardedAt: "desc"
            },
        });
        res.json(users) 
    } catch (error) {
        res.status(500).json({ message: "Error retreiving users."})
    }
}


export const getUserById = async (req: Request, res: Response) => {
    try {
        const {id} = req.params;

        const user = await prisma.users.findUnique({
            where: {id},
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                location: true,
                createdAt: true,
                lastLogin: true,
                onboardedAt: true,
            }
        });

        if (!user) {
            return res.status(404).json({error: "User not found"})
        }
    } catch (e) {
        console.error(e)
        return res.status(500).json({error: "Failed to fetch user"})
    }
}

export const updateUser = async (req: Request, res: Response) => {
    try {
        const {id} = req.params;
        const { name, location } = req.body;

        const auth = (req as any).auth as {userId: string}
        const actorClerkId = auth.userId;
    

    const actor = await prisma.users.findUnique({
        where: { clerkId: actorClerkId},
        select: { role: true }
    });

    if (!actor) {
        return res.status(401).json({ error: "unauthorized"})
    }

    const targetUser = await prisma.users.findUnique({
        where: { id },
        select: {role: true}
    });
    
    if (!targetUser) {
        return res.status(404).json({ error: "user not found"})
    }

    //Check if actor can modify targeted user
    const {canModify, reason} = canModifyUserRole(
        actor.role as Role,
        targetUser.role as Role,
        targetUser.role as Role
    );

    if (!canModify) {
        return res.status(403).json({error: reason || "Insufficient Permissions"})
    }

    const updated = await prisma.users.update({
        where: { id },
        data: {
            ...(name !== undefined ? { name } : {}),
            ...(location !== undefined ? { location } : {}),
            },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            location:true,
        }
    });

    return res.json(updated);
} catch (e) {
    console.error("Error updating user:" , e)
    return res.status(500).json({erro: "Failed to update user"})
}
}


export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role: newRole } = req.body;

    if (!Object.values(Role).includes(newRole)) {
      return res.status(400).json({ error: "invalid Role" });
    }

    const auth = (req as any).auth as { userId: string };
    const actorClerkId = auth.userId;

    const actor = await prisma.users.findUnique({
      where: { clerkId: actorClerkId },
      select: { role: true },
    });

    if (!actor) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const targetUser = await prisma.users.findUnique({
      where: { id },
      select: {
        role: true,
        accessStatus: true,
        name: true,
        email: true,
      },
    });

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const { canModify, reason } = canModifyUserRole(
      actor.role as Role,
      targetUser.role as Role,
      newRole as Role
    );

    if (!canModify) {
      return res.status(403).json({ error: reason || "Insufficient Permissions" });
    }

    const updated = await prisma.users.update({
      where: { id },
      data: { role: newRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        location: true,
        accessStatus: true,
      },
    });

    // Only send the "you now have access" email when:
    // 1. access is already granted
    // 2. old role was viewer
    // 3. new role is now a real role
    if (
      updated.accessStatus === "granted" &&
      (targetUser.role === Role.viewer || Role.orderAgent || Role.labStaff || Role.inventoryClerk || Role.admin) &&
      updated.role !== Role.viewer
    ) {
      try {
        await messageToOnboardedUser({
          name: updated.name,
          email: updated.email,
          role: updated.role,
        });

        console.log("✅ Final access email sent to:", updated.email);
      } catch (emailError) {
        console.error("❌ Failed to send final access email:", emailError);
      }
    }

    return res.json(updated);
  } catch (e) {
    console.error("Error updating user role:", e);
    return res.status(500).json({ error: "Failed to update user role" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const {id} = req.params

        const auth = (req as any).auth as {userId: string};
        const actorClerkId = auth.userId

        const actor = await prisma.users.findUnique({
            where: {clerkId: actorClerkId},
            select: {
                role: true,
                id: true,
            },
        });

        if (!actor) {
            return res.status(401).json({error: "unauthorized"})
        }

        //user can not delete their own account
        if (actor.id === id ){
            return res.status(400).json({error: "Can not delete your own account"})
        }

        const targetUser = await prisma.users.findUnique({
            where: {id},
            select: { role: true }
        })

        if (!targetUser) {
            return res.status(404).json({ error: "User not found"})
        }

        //check if an actor can modify a target 

        const { canModify, reason } = canModifyUserRole(
            actor.role as Role,
            targetUser.role as Role,
            targetUser.role as Role,
        );

        if(!canModify) {
            return res.status(403).json({ error: reason || "Insufficient permission"})
        }

        await prisma.users.delete({
            where: {id }
        });

        return res.json({ sucess: true, message: "User delete successfully"})
    } catch (error) {
        console.error("Error deleting user: ", error)
        return res.status(500).json({ error: "Failed to delete user"})
    }
}
/**
 * GET /users/me
 * Returns the logged-in user from your DB (role + location come from Prisma).
 *
 * Requires auth middleware to attach clerkId to req.auth (or similar).
 */
export const getMe = async (req: Request, res: Response) => {
  try {
    // Get Clerk ID from auth middleware
    const clerkId =
      (req as any).auth?.userId ||
      (typeof (req as any).auth === "function" 
        ? (req as any).auth()?.userId 
        : undefined) ||
      (req as any).userId;

    if (!clerkId) {
      return res.status(401).json({ 
        message: "Unauthorized: missing Clerk userId" 
      });
    }

    // Find user in database
    const dbUser = await prisma.users.findUnique({
      where: { clerkId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        role: true,
        location: true,
        createdAt: true,
        lastLogin: true,
        onboardedAt: true,
				accessStatus: true,
      },
    });

    if (!dbUser) {
      // User exists in Clerk but not in DB - auto-provision
      // You can either create the user here or return 404
      return res.status(404).json({
        message: "User not found in database. Please complete onboarding.",
        clerkId, // Return clerkId so frontend knows who they are
      });
    }

    // ✅ Update last login timestamp
    await prisma.users.update({
      where: { clerkId },
      data: { lastLogin: new Date() },
    });

    return res.json({ user: dbUser });
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({ 
      message: "Failed to fetch current user" 
    });
  }
};


export const reviewUserAccess = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { token } = req.query;
  const { action } = req.body as { action?: "grant" | "deny" };

  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Missing approval token" });
  }

  if (!action || !["grant", "deny"].includes(action)) {
    return res.status(400).json({ error: "Invalid action" });
  }

  let payload: { userId: string; action: "grant" | "deny" };

  try {
    payload = verifyApprovalToken(token);
  } catch {
    return res.status(401).json({ error: "Token is invalid or has expired" });
  }

  if (payload.userId !== id) {
    return res.status(400).json({ error: "Token mismatch" });
  }

  if (payload.action !== action) {
    return res.status(400).json({ error: "Action mismatch" });
  }

  const clerkId = (req as any).auth?.userId;

  if (!clerkId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const reviewer = await prisma.users.findUnique({
    where: { clerkId },
    select: {
      role: true,
      accessStatus: true,
      name: true,
      email: true,
    },
  });

  if (
    !reviewer ||
    !["admin", "inventoryClerk"].includes(reviewer.role) ||
    reviewer.accessStatus !== "granted"
  ) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }

  const newStatus = action === "grant" ? "granted" : "denied";

  const updated = await prisma.users.update({
    where: { id },
    data: { accessStatus: newStatus },
    select: {
      id: true,
      name: true,
      email: true,
      accessStatus: true,
    },
  });

  return res.json({
    message: `Access ${newStatus} successfully`,
    user: updated,
  });
};

// server/src/controllers/userController.ts


export const messageToOnboardedUser = async (user: {
  name: string | null;
  email: string;
  role: string;
}) => {
  const CLIENT_URL = process.env.CLIENT_URL!;
  const sender = process.env.PROD_RESEND_SENDER_EMAIL;

  if (!sender) {
    throw new Error("PROD_RESEND_SENDER_EMAIL is missing");
  }

  const header = `Access Response <${sender}>`;

  const subject = "Your access has been approved";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2>Access Approved</h2>
      <p>Hello ${user.name ?? user.email},</p>
      <p>Your account is now fully ready, thank you for your patience.</p>

      <div style="margin-top: 24px;">
        <a
          href="${CLIENT_URL}/products"
          style="display:inline-block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;"
        >
          Go to Products
        </a>
      </div>
    </div>
  `;

  const result = await resend.emails.send({
    from: header,
    to: user.email,
    subject,
    html,
  });

  if (result.error) {
    throw result.error;
  }

  return result.data;
};