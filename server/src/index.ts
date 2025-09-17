import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import dashboardRoutes from './routes/dashboardRoutes';
import productRoutes from './routes/productRoutes';
import userRoutes from "./routes/userRoutes"
import expenseRoutes from "./routes/expenseRoute"
import supplierRoutes from "./routes/supplierRoutes"
import purchaseOrderRoutes from "./routes/purchaseOrderRoutes"
import invoiceRoutes from "./routes/invoiceRoutes"
import goodsReceiptRoutes from "./routes/goodsReceiptRoute";

dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());


// routes
app.use("/dashboard", dashboardRoutes); // http://localhost:8000/dashboard
app.use("/products", productRoutes); // http://localhost:8000/products
app.use('/users', userRoutes ); //http://localhost:8000/users
app.use("/expenses", expenseRoutes); //http://localhost:8000/expenses
app.use("/suppliers",supplierRoutes ); //http://localHost:8000/suppliers
app.use("/purchase-orders", purchaseOrderRoutes); //http://localhost:8000/purhase-orders
app.use("/invoices", invoiceRoutes); //http://localhost:8000/invoices
app.use("/grns", goodsReceiptRoutes)//http://localhost:8000/grns

// server
const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server running on port ${port}`))