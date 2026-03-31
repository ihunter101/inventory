import jwt from "jsonwebtoken";

const SECRET = process.env.APPROVAL_TOKEN_SECRET!;

interface ApprovalPayload {
  userId: string;
  action: "grant" | "deny";
}
export const signApprovalToken = (payload: ApprovalPayload): string =>
  jwt.sign(payload, SECRET, { expiresIn: "24h" })


export const verifyApprovalToken = (token: string): ApprovalPayload => 
  jwt.verify(token, SECRET) as ApprovalPayload;
