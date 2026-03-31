import { signApprovalToken } from "../lib/approvalToken";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export const buildNewUserEmail = (user: {
  id: string;
  name: string | null;
  email: string;
  location: string;
}) => {
  const grantToken = signApprovalToken({ userId: user.id, action: "grant" });
  const denyToken  = signApprovalToken({ userId: user.id, action: "deny"  });

 const CLIENT_URL = process.env.CLIENT_URL!;

const grantUrl = `${CLIENT_URL}/users/review?id=${user.id}&token=${grantToken}&action=grant`;
const denyUrl  = `${CLIENT_URL}/users/review?id=${user.id}&token=${denyToken}&action=deny`;

  return {
    subject: `New user awaiting access — ${user.name ?? user.email}`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: auto;">
        <h2>New user requesting access</h2>

        <table style="width:100%; border-collapse:collapse; margin: 16px 0;">
          <tr><td style="padding:6px; color:#666;">Name</td>     <td style="padding:6px;">${user.name ?? "—"}</td></tr>
          <tr><td style="padding:6px; color:#666;">Email</td>    <td style="padding:6px;">${user.email}</td></tr>
          <tr><td style="padding:6px; color:#666;">Location</td> <td style="padding:6px;">${user.location}</td></tr>
        </table>

        <div style="display:flex; gap:12px; margin-top:24px;">
          <a href="${grantUrl}"
             style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
            ✅ Approve Access
          </a>
          <a href="${denyUrl}"
             style="background:#dc2626;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
            ❌ Deny Access
          </a>
        </div>

        <p style="margin-top:24px; color:#888; font-size:12px;">
          This link expires in 24 hours. You can also manage users at
          <a href="${process.env.CLIENT_URL}/users">${process.env.CLIENT_URL}/users</a>
        </p>
      </div>
    `,
  };
};