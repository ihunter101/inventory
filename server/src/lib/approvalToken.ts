// import jwt from "jsonwebtoken";

// const SECRET = process.env.APPROVAL_TOKEN_SECRET!;

// interface ApprovalPayload {
//   userId: string;
//   action: "grant" | "deny";
// }
// export const signApprovalToken = (payload: ApprovalPayload): string =>
//   jwt.sign(payload, SECRET, { expiresIn: "24h" })


// export const verifyApprovalToken = (token: string): ApprovalPayload => 
//   jwt.verify(token, SECRET) as ApprovalPayload;




// server/src/lib/approvalToken.ts
import jwt from "jsonwebtoken";

const APPROVAL_TOKEN_SECRET = process.env.APPROVAL_TOKEN_SECRET;

if (!APPROVAL_TOKEN_SECRET) {
  throw new Error("APPROVAL_TOKEN_SECRET is missing from environment variables");
}

type ApprovalPayload = {
  userId: string;
  action: "grant" | "deny";
};

export const signApprovalToken = (payload: ApprovalPayload)  =>
   jwt.sign(payload, APPROVAL_TOKEN_SECRET, { expiresIn: "24h" });


export const verifyApprovalToken = (token: string) =>
   jwt.verify(token, APPROVAL_TOKEN_SECRET) as ApprovalPayload;
