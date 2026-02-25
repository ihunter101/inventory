import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import helmet from "helmet";
import morgan from "morgan";
import { clerkMiddleware } from "@clerk/express";

// 1) Load env from the first existing .env (keep it simple)
const candidates = [
  path.resolve(__dirname, "../.env"),         // server/.env when running from dist
  path.resolve(process.cwd(), "server/.env"), // if started from repo root
  path.resolve(process.cwd(), ".env"),        // if started inside /server
];
const envPath = candidates.find(p => fs.existsSync(p));
dotenv.config(envPath ? { path: envPath } : undefined);

console.log("[BOOT] envPath =", envPath ?? "(none)");
console.log("[BOOT] PORT =", process.env.PORT || 8000);

// Environment validation (single check)
if (!process.env.CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
  console.error("[Clerk] Missing keys. Check server/.env is being loaded.");
  console.error("  CLERK_PUBLISHABLE_KEY:", !!process.env.CLERK_PUBLISHABLE_KEY);
  console.error("  CLERK_SECRET_KEY:", !!process.env.CLERK_SECRET_KEY);
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("[DB] DATABASE_URL missing");
  process.exit(1);
}

import { ensureUser } from "./middleware/ensureUser"; 

// 2) Import your routers (use your actual filenames)
import dashboardRoutes from "./routes/dashboardRoutes";
import productRoutes from "./routes/productRoutes";
import userRoutes from "./routes/userRoutes";
import expenseRoutes from "./routes/expenseRoute";
import supplierRoutes from "./routes/supplierRoutes";
import purchaseOrderRoutes from "./routes/purchaseOrderRoutes";
import invoiceRoutes from "./routes/invoiceRoutes";
import goodsReceiptRoutes from "./routes/goodsReceiptRoute";
import inventoryRoutes from "./routes/inventoryRoutes"
import draftProductRoutes from "./routes/productDraftRoutes"
import  stockSheetRoutes  from "./routes/stocksheetRoutes";
import salesRoutes from "./routes/salesRoutes";
import meRoutes from "./routes/meRoutes";
import emailRoutes from "./routes/emailRoutes";
import matchROutes from "./routes/matchRoutes"
import paymentRouter from "./routes/paymentRoutes";

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const app = express();

// 3) Clerk FIRST (so req.auth exists for downstream)
app.use(clerkMiddleware());

// 4) Normal middleware
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true, // allow Clerk cookie to flow
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Public routes (no auth required)
app.get("/health", (_req, res) => res.json({ ok: true }));

// 5) Create protected router with BOTH ensureUser AND routes
const protectedRouter = express.Router();

// ✅ CRITICAL: ensureUser must run FIRST, before any routes
// This creates the user in DB if they don't exist
protectedRouter.use(...ensureUser());

// 6) Mount protected routers (they can now use must() safely)
protectedRouter.use("/dashboard", dashboardRoutes);
protectedRouter.use("/products", productRoutes);
protectedRouter.use("/users", userRoutes);
protectedRouter.use("/expenses", expenseRoutes);
protectedRouter.use("/suppliers", supplierRoutes);
protectedRouter.use("/purchase-orders", purchaseOrderRoutes);
protectedRouter.use("/invoices", invoiceRoutes);
protectedRouter.use("/grns", goodsReceiptRoutes);
protectedRouter.use("/inventory", inventoryRoutes);
protectedRouter.use("/draft-products", draftProductRoutes);
protectedRouter.use("/stock-requests", stockSheetRoutes);
protectedRouter.use("/me", meRoutes);
protectedRouter.use("/sales", salesRoutes);
protectedRouter.use("/emails", emailRoutes);
protectedRouter.use('/matches', matchROutes);
protectedRouter.use('/payments', paymentRouter)

// Mount the protected router
app.use(protectedRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Error]:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const port = Number(process.env.PORT || 8000);
app.listen(port, () => console.log(`Server running on port ${port}`));