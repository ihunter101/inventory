import crypto from "crypto";
import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { prisma } from "../lib/prisma"
import resend from "../config/resend";

function hashToken(token: string){
    return crypto.createHash("sha256").update(token).digest("hex");
}

function generateInviteToken() {
    return crypto.randomBytes(32).toString("hex")
}

export const createInvite = async (req: Request, res: Response) => {
    try {
        const { organizationId } = req.params;
        const { email, role= "clientUser" } = req.body;

        if (!email || typeof email !== "string"){
            return res.status(400).json({ messsage: "Email is required"})
        }

        if (role !== "clientUser" && role !== "clientAdmin"){
            return res.status(400).json({ message: "Invite role must either be clientUser or clientAdmin"})

        }

        const organization = await prisma.organization.findUnique({
          where: { organizationId },
        });

        if (!organization) {
          return res.status(404).json({ message: "Organization not found."})
        }

        const rawToken  = generateInviteToken();
        const tokenHash = hashToken(rawToken);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const auth = getAuth(req);


        const invite = await prisma.inviteToken.create({
          data: {
            tokenHash,
            organizationId,
            role,
            email: email.toLocaleLowerCase().trim(),
            expiresAt,
            createdByUserId: auth.userId ?? null,
          },
          select: {
            id: true,
            organizationId: true,
            role: true,
            email: true,
            expiresAt: true,
            createdAt: true,
          },
        });

        const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
        const inviteLink = `${clientUrl}/client-invite?token=${rawToken}`;

        let emailSent = false;

try {
  await sendClientInviteEmail({
    to: email.toLowerCase().trim(),
    organizationName: organization.name,
    inviteLink,
    role,
  });

  emailSent = true;
} catch (emailError) {
  console.error("Invite created, but email failed:", emailError);
}

return res.status(201).json({
  message: emailSent
    ? "Invite created and email sent successfully"
    : "Invite created, but email failed to send",
  invite,
  inviteLink,
  emailSent,
});

    } catch (error) {
        console.error("Failed to create invite:", error)
        return res.status(500).json({ message: "Failed to create Invite"})
    }
}

export async function acceptInvite(req: Request, res: Response) {
  try {
    const { token } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "token is required" });
    }

    const auth = getAuth(req);

    if (!auth.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const tokenHash = hashToken(token);

    const result = await prisma.$transaction(async (tx) => {
      const invite = await tx.inviteToken.findUnique({
        where: { tokenHash },
        include: {
          organization: true,
        },
      });

      if (!invite) {
        throw new Error("INVITE_NOT_FOUND");
      }

      if (invite.usedAt) {
        throw new Error("INVITE_ALREADY_USED");
      }

      if (invite.expiresAt < new Date()) {
        throw new Error("INVITE_EXPIRED");
      }

      const user = await tx.users.findUnique({
        where: { clerkId: auth.userId },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
        throw new Error("EMAIL_MISMATCH");
      }

      const updatedUser = await tx.users.update({
        where: { id: user.id },
        data: {
          organizationId: invite.organizationId,
          role: invite.role,
          accessStatus: "granted",
          onboardedAt: user.onboardedAt ?? new Date(),
        },
        include: {
          organization: {
            include: {
              customer: true,
            },
          },
        },
      });

      const updatedInvite = await tx.inviteToken.update({
        where: { id: invite.id },
        data: {
          usedAt: new Date(),
          usedByUserId: updatedUser.id,
        },
      });

      return {
        user: updatedUser,
        invite: updatedInvite,
      };
    });

    return res.json({
      message: "Invite accepted successfully",
      user: result.user,
      redirectTo: "/client/dashboard",
    });
  } catch (error: any) {
    console.error("Failed to accept invite:", error);

    if (error.message === "INVITE_NOT_FOUND") {
      return res.status(404).json({ message: "Invite not found" });
    }

    if (error.message === "INVITE_ALREADY_USED") {
      return res.status(409).json({ message: "Invite has already been used" });
    }

    if (error.message === "INVITE_EXPIRED") {
      return res.status(410).json({ message: "Invite has expired" });
    }

    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        message: "User account not found. Please complete signup first.",
      });
    }

    if (error.message === "EMAIL_MISMATCH") {
      return res.status(403).json({
        message: "This invite was sent to a different email address",
      });
    }

    return res.status(500).json({ message: "Failed to accept invite" });
  }
}


export const getOrganizationInvites = async (req: Request, res: Response) => {
try {
  const { organizationId } = req. params;

  const invites = await prisma.inviteToken.findMany({
    where: { organizationId },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true, 
      usedAt: true,
      usedByUserId: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc"
    },
  })

  return res.json({ invites})

} catch (error) {
   console.error("Failed to fetch organization invites:", error);
    return res.status(500).json({ message: "Failed to fetch organization invites" });
}
}

export async function sendClientInviteEmail({
  to,
  organizationName,
  inviteLink,
  role,
}: {
  to: string;
  organizationName: string;
  inviteLink: string;
  role: string;
}) {
  //const header = process.env.SENDER_EMAIL || "Lab Services <noreply@example.com>";


  const from = process.env.PROD_RESEND_SENDER_EMAIL || "Client Portal <support@slulabservices.com>";

  return resend.emails.send({
    from,
    to,
    subject: `You're invited to access ${organizationName}'s client portal`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Client Portal Invitation</h2>

        <p>
          You have been invited to access the client portal for:
        </p>

        <p style="font-size: 18px; font-weight: bold;">
          ${organizationName}
        </p>

        <p>
          Your assigned access role is:
          <strong>${role === "clientAdmin" ? "Client Admin" : "Client User"}</strong>
        </p>

        <p>
          Click the button below to accept your invite and create your account.
        </p>

        <p>
          <a href="${inviteLink}"
             style="display: inline-block; padding: 12px 18px; background: #111827; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Accept Invite
          </a>
        </p>

        <p style="font-size: 13px; color: #6b7280;">
          If the button does not work, copy and paste this link into your browser:
        </p>

        <p style="font-size: 13px; word-break: break-all; color: #374151;">
          ${inviteLink}
        </p>

        <p style="font-size: 13px; color: #6b7280;">
          This invitation will expire soon. If you did not expect this invite, you can ignore this email.
        </p>
      </div>
    `,
  });
}