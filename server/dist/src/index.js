"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const expenseRoute_1 = __importDefault(require("./routes/expenseRoute"));
const supplierRoutes_1 = __importDefault(require("./routes/supplierRoutes"));
const purchaseOrderRoutes_1 = __importDefault(require("./routes/purchaseOrderRoutes"));
const invoiceRoutes_1 = __importDefault(require("./routes/invoiceRoutes"));
const goodsReceiptRoute_1 = __importDefault(require("./routes/goodsReceiptRoute"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, helmet_1.default)());
app.use(helmet_1.default.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use((0, morgan_1.default)("common"));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use((0, cors_1.default)());
// routes
app.use("/dashboard", dashboardRoutes_1.default); // http://localhost:8000/dashboard
app.use("/products", productRoutes_1.default); // http://localhost:8000/products
app.use('/users', userRoutes_1.default); //http://localhost:8000/users
app.use("/expenses", expenseRoute_1.default); //http://localhost:8000/expenses
app.use("/suppliers", supplierRoutes_1.default);
app.use("/purchase-orders", purchaseOrderRoutes_1.default);
app.use("/invoices", invoiceRoutes_1.default);
app.use("/grns", goodsReceiptRoute_1.default);
// server
const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server running on port ${port}`));
