// src/types/express.d.ts
import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string }; // Clerk sets this
    }
  }
}