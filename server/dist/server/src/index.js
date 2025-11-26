"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/src/index.ts
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_2 = require("@clerk/express");
// 1) Load env from the first existing .env (keep it simple)
const candidates = [
    path_1.default.resolve(__dirname, "../.env"), // server/.env when running from dist
    path_1.default.resolve(process.cwd(), "server/.env"), // if started from repo root
    path_1.default.resolve(process.cwd(), ".env"), // if started inside /server
];
const envPath = candidates.find(p => fs_1.default.existsSync(p));
dotenv_1.default.config(envPath ? { path: envPath } : undefined);
console.log("[BOOT] envPath =", envPath !== null && envPath !== void 0 ? envPath : "(none)");
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
const ensureUser_1 = require("./middleware/ensureUser");
// 2) Import your routers (use your actual filenames)
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const expenseRoute_1 = __importDefault(require("./routes/expenseRoute"));
const supplierRoutes_1 = __importDefault(require("./routes/supplierRoutes"));
const purchaseOrderRoutes_1 = __importDefault(require("./routes/purchaseOrderRoutes"));
const invoiceRoutes_1 = __importDefault(require("./routes/invoiceRoutes"));
const goodsReceiptRoute_1 = __importDefault(require("./routes/goodsReceiptRoute"));
const inventoryRoutes_1 = __importDefault(require("./routes/inventoryRoutes"));
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
const app = (0, express_1.default)();
// 3) Clerk FIRST (so req.auth exists for downstream)
app.use((0, express_2.clerkMiddleware)());
// 4) Normal middleware
app.use(express_1.default.json());
app.use((0, helmet_1.default)());
app.use(helmet_1.default.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use((0, morgan_1.default)("common"));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use((0, cors_1.default)({
    origin: ["http://localhost:3000"],
    credentials: true, // allow Clerk cookie to flow
}));
// Public routes (no auth required)
app.get("/health", (_req, res) => res.json({ ok: true }));
// 5) Apply ensureUser to all protected routes
// Create a router for protected routes
const protectedRouter = express_1.default.Router();
protectedRouter.use(...(0, ensureUser_1.ensureUser)());
// 6) Mount protected routers
protectedRouter.use("/dashboard", dashboardRoutes_1.default);
protectedRouter.use("/products", productRoutes_1.default);
protectedRouter.use("/users", userRoutes_1.default);
protectedRouter.use("/expenses", expenseRoute_1.default);
protectedRouter.use("/suppliers", supplierRoutes_1.default);
protectedRouter.use("/purchase-orders", purchaseOrderRoutes_1.default);
protectedRouter.use("/invoices", invoiceRoutes_1.default);
protectedRouter.use("/grns", goodsReceiptRoute_1.default);
protectedRouter.use("/inventory", inventoryRoutes_1.default);
// Mount the protected router
app.use(protectedRouter);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('[Server Error]:', err);
    res.status(500).json({ error: 'Internal server error' });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
const port = Number(process.env.PORT || 8000);
app.listen(port, () => console.log(`Server running on port ${port}`));
