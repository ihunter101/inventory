// server/src/emails/accessDecisionEmail.ts
export const buildAccessDecisionEmail = (user: {
  name: string | null;
  email: string;
  action: "grant" | "deny";
}) => {
  const CLIENT_URL = process.env.CLIENT_URL!;

  const isGranted = user.action === "grant";
  const targetUrl = isGranted ? `${CLIENT_URL}/products` : `${CLIENT_URL}/sign-in`;

  return {
    subject: isGranted
      ? "Your access has been approved"
      : "Your access request was reviewed",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
        <h2 style="margin-bottom: 8px;">
          ${isGranted ? "Access Approved" : "Access Update"}
        </h2>

        <p style="color: #555; line-height: 1.6;">
          Hello ${user.name ?? user.email},
        </p>

        ${
          isGranted
            ? `
              <p style="color: #555; line-height: 1.6;">
                Your account has been approved. You can now access the system.
              </p>

              <div style="margin-top: 24px;">
                <a href="${targetUrl}"
                   style="display:inline-block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
                  Go to Products
                </a>
              </div>
            `
            : `
              <p style="color: #555; line-height: 1.6;">
                Your access request was reviewed, but access was not granted at this time.
              </p>

              <div style="margin-top: 24px;">
                <a href="${targetUrl}"
                   style="display:inline-block;background:#111827;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
                  Return to Sign In
                </a>
              </div>
            `
        }

        <p style="margin-top: 24px; color: #888; font-size: 12px;">
          If you did not expect this email, please ignore it.
        </p>
      </div>
    `,
  };
};