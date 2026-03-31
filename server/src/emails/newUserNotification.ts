// server/src/emails/buildNewUserEmail.ts
import { signApprovalToken } from "../lib/approvalToken";

export const buildNewUserEmail = (user: {
  id: string;
  name: string | null;
  email: string;
  location: string;
}) => {
  const CLIENT_URL = process.env.CLIENT_URL!;

  const grantToken = signApprovalToken({ userId: user.id, action: "grant" });
  const denyToken = signApprovalToken({ userId: user.id, action: "deny" });

  const grantUrl = `${CLIENT_URL}/users/review?id=${user.id}&token=${grantToken}&action=grant`;
  const denyUrl = `${CLIENT_URL}/users/review?id=${user.id}&token=${denyToken}&action=deny`;

  return {
    subject: `New user awaiting access — ${user.name ?? user.email}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
        <h2 style="margin-bottom: 8px;">New user requesting access</h2>
        <p style="color: #555; margin-bottom: 20px;">
          A new user has completed onboarding and is awaiting review.
        </p>

        <table style="width:100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #e5e7eb;">
          <tr>
            <td style="padding:10px; color:#666; border-bottom:1px solid #e5e7eb; width:140px;">Name</td>
            <td style="padding:10px; border-bottom:1px solid #e5e7eb;">${user.name ?? "—"}</td>
          </tr>
          <tr>
            <td style="padding:10px; color:#666; border-bottom:1px solid #e5e7eb;">Email</td>
            <td style="padding:10px; border-bottom:1px solid #e5e7eb;">${user.email}</td>
          </tr>
          <tr>
            <td style="padding:10px; color:#666;">Location</td>
            <td style="padding:10px;">${user.location}</td>
          </tr>
        </table>

        <div style="margin-top: 24px;">
          <a href="${grantUrl}"
             style="display:inline-block; background:#16a34a; color:#fff; padding:12px 20px; border-radius:8px; text-decoration:none; font-weight:600; margin-right:12px;">
            Approve Access
          </a>

          <a href="${denyUrl}"
             style="display:inline-block; background:#dc2626; color:#fff; padding:12px 20px; border-radius:8px; text-decoration:none; font-weight:600;">
            Deny Access
          </a>
        </div>

        <p style="margin-top:24px; color:#888; font-size:12px;">
          This link expires in 24 hours.
        </p>

        <p style="margin-top:8px; color:#888; font-size:12px;">
          You can also manage users manually here:
          <a href="${CLIENT_URL}/users">${CLIENT_URL}/users</a>
        </p>
      </div>
    `,
  };
};