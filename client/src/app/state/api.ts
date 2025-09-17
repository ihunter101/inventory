import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// ----------------------
// Interfaces
// ----------------------

export interface Product {
  productId: string;
  name: string;
  price: number;
  rating?: number;
  stockQuantity: number;
  unit?: string; //added only to assist in the CreatePruchasreOrderModal
}

export interface NewProduct {
  name: string;
  price: number;
  rating?: number;
  stockQuantity: number;
}

export interface SalesSummary {
  salesSummaryId: string;
  totalValue: number;
  changePercentage?: number;
  date: string;
}

export interface PurchaseSummary {
  purchaseSummaryId: string;
  totalPurchased: number;
  changePercentage?: number;
  date: string;
}

export interface ExpenseSummary {
  expenseSummaryId: string;
  totalExpenses: number;
  date: string;
}

export interface ExpenseByCategorySummary {
  expenseByCategorySummaryId: string;
  category: string;
  amount: string;
  date: string;
}

export interface DashboardMetrics {
  popularProducts: Product[];
  salesSummary: SalesSummary[];
  purchaseSummary: PurchaseSummary[];
  expenseSummary: ExpenseSummary[];
  expenseByCategorySummary: ExpenseByCategorySummary[];
}

export interface User {
  userId: string;
  name: string;
  email: string;
  role: string;
  location: string;
  createdAt: string;
  lastLogin: string;
}

export interface Expense {
  expenseId: string;
  category: string;
  amount: number;
  date: string;
  status: string;
  description?: string; 
};


// ------------
//purchases
//-------------
export interface Supplier {
  supplierId: string 
  name: string;
  email?: string; 
  phone?: string; 
  number?: string;
}

// types
export type POStatus =
  | "DRAFT" | "APPROVED" | "SENT" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CLOSED";
export type InvoiceStatus = "PENDING" | "PAID" | "OVERDUE"
export type GRNStatus = "DRAFT" | "POSTED";

export interface POItem {
  id?: string; 
  productId: string; 
  sku?: string; 
  name: string; 
  unit: string;
  quantity: number; 
  unitPrice: number; 
  lineTotal: number; 
}

export interface PurchaseOrderDTO {
  id: string;
  poNumber: string; 
  supplierId: string; 
  supplier?: string;
  status: POStatus; 
  orderDate: string;
  dueDate?: string;
  notes?: string;
  items: POItem[]
  subtotal: number;
  tax: number;
  total: number;
  category?: string;
}

export interface NewPurchaseOrderDTO extends Omit<PurchaseOrderDTO, "id"|"poNumber"> {
  poNumber?: string //server can assign if ommitted
}

export interface InvoiceLine {
  productId: string;
  sku?: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
}

export interface SupplierInvoiceDTO {
  poNumber: string;
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplier?: string;
  poId?: string;
  status: InvoiceStatus;
  date: string;
  dueDate?: string;
  lines: InvoiceLine[];
  amount: number;
  category?: string;
}

export interface GoodsReceiptLine {
  productId: string;
  sku?: string;
  name: string;
  unit: string;
  receivedQty: number;
  unitPrice?: number;

}

export interface GoodsReceiptDTO {
  id: string; 
  grnNumber: string;
  poId: string;
  poNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  date: string;
  status: GRNStatus;
  lines: GoodsReceiptLine[];


}





// ----------------------
// API Setup
// ----------------------

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  }),
  tagTypes: [
    "DashboardMetrics", "Products", "Users", "Expenses",
    "PurchaseOrders", "SupplierInvoices", "GoodsReceipts", "Suppliers"
  ],
  endpoints: (build) => ({
    // Dashboard Metrics
    getDashboardMetrics: build.query<DashboardMetrics, void>({
      query: () => "/dashboard",
      providesTags: ["DashboardMetrics"],
    }),

    // Products
    getProducts: build.query<Product[], string | void>({
      query: (search) => ({
        url: "/products",
        params: search ? { search } : {},
      }),
      providesTags: ["Products"],
    }),
    createProduct: build.mutation<Product, NewProduct>({
      query: (newProduct) => ({
        url: "/products",
        method: "POST",
        body: newProduct,
      }),
      invalidatesTags: ["Products"],
    }),

    // Users
    getUsers: build.query<User[], void>({
      query: () => "/users",
      providesTags: ["Users"],
    }),

    // Expenses
   getExpenses: build.query<Expense[], { category?: string; from?: string; to?: string } | void>({
    query: (params) => {
        return {
        url: "/expenses",
        params: params ?? undefined, // explicitly ensures correct type
        };
    },
  providesTags: ["Expenses"],
  }),
  // Suppliers (basic)
  getSuppliers: build.query<Supplier[], void>({
    query: () => "/suppliers",
    providesTags: ["Suppliers"],
  }),
   
  // Purchases
  getPurchaseOrders: build.query<PurchaseOrderDTO[], {status?: POStatus; q?: string} | void>({
    query: (params) => ({url: "/purchase-orders", params: params ?? undefined}),
    providesTags: ["PurchaseOrders"],
  }), 
  getPurchaseOrder: build.query<PurchaseOrderDTO, string>({
    query: (poId) => `/purchase-orders/${poId}`,
    providesTags: (_r, _e, id) => [{ type: "PurchaseOrders", id }],
  }),
  createPurchaseOrder: build.mutation<PurchaseOrderDTO, NewPurchaseOrderDTO>({
    query: (body) => ({ url: "/purchase-orders", method: "POST", body }),
    invalidatesTags: ["PurchaseOrders", "DashboardMetrics"]
  }),
  updatePurchaseOrderStatus: build.mutation<PurchaseOrderDTO, { id: string; status: POStatus }>({
    query: ({ id, status }) => ({
      url: `/purchase-orders/${id}/status`,
      method: "PATCH",
      body: { status },
    }),
    invalidatesTags: (_r, _e, { id }) => [{ type: "PurchaseOrders", id}],
  }),

  // SupplierInvoice
  getSupplierInvoices: build.query<SupplierInvoiceDTO[], { status?: InvoiceStatus; q?: string } | void>({
    query: (params) => ({ url: "/invoices", params: params ?? undefined}),
    providesTags: ["SupplierInvoices"],
  }),
  createSupplierInvoice: build.mutation<SupplierInvoiceDTO, Partial<SupplierInvoiceDTO>>({
    query: (body) => ({ url: "/invoices", method: "POST", body}),
    invalidatesTags: ["SupplierInvoices", "PurchaseOrders", "DashboardMetrics"],
  }),
  markInvoicePaid: build.mutation<SupplierInvoiceDTO, { id: string }>({
  query: ({ id }) => ({ url: `/invoices/${id}/status`, method: "PATCH" }),
  invalidatesTags: (_r, _e, { id }) => [{ type: "SupplierInvoices", id }],
}),

  // Goods Receipt
  getGoodsReceipts: build.query<GoodsReceiptDTO[], { q?: string } | void>({
  query: (params) => ({ url: "/grns", params: params ?? undefined }),
  providesTags: ["GoodsReceipts", "PurchaseOrders"],
}),
createGRN: build.mutation<GoodsReceiptDTO, Partial<GoodsReceiptDTO>>({
  query: (body) => ({ url: "/grns", method: "POST", body }),
  invalidatesTags: ["GoodsReceipts", "PurchaseOrders"],
}),
postGRN: build.mutation<{ ok: true }, { id: string }>({
  query: ({ id }) => ({ url: `/grns/${id}/post`, method: "POST" }),
  invalidatesTags: ["GoodsReceipts", "PurchaseOrders", "Products", "DashboardMetrics"],
}),
    // Expenses
    createExpense: build.mutation<Expense, Partial<Expense>>({
      query: (expense) => ({
        url: "/expenses",
        method: "POST",
        body: expense,
      }),
      invalidatesTags: ["Expenses", "DashboardMetrics"],
    }),
  }),
});

// ----------------------
// Hooks
// ----------------------

export const {
  useGetDashboardMetricsQuery,
  useGetProductsQuery,
  useCreateProductMutation,
  useGetUsersQuery,

  useGetExpensesQuery,
  useCreateExpenseMutation,

  useGetSuppliersQuery,
  useGetPurchaseOrderQuery,
  useGetPurchaseOrdersQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderStatusMutation,

  useGetSupplierInvoicesQuery,
  useCreateSupplierInvoiceMutation,
  useMarkInvoicePaidMutation,

  useGetGoodsReceiptsQuery,
  useCreateGRNMutation,
  usePostGRNMutation,
} = api;


// the CreateApi function has four properties 
// the reducer path which is where all the information about stored data and states related to your app is 
// the baseQuery prop which contains a functions called baseQuery set the baseURL for getting to your inital webpage and from there more urls paths can be added
// tagTypes help assign tags to a some kind of object (data) and tracks it so if something changes redux toolkit reflects those new changes
// endpoints are the last file paths in a URL. Here DashboardMetrics is the name we give to this endpoint. build.query tells it that its a get request (were fetching data) 
// ... cont and DashbaordMetrics is they type of data we expect back. which is popular products, sales summary, purchases summary, expense summary and expense by category from the interface DashboardMetrics
// and void means this query takes no inputs nor does it have any parameters 
// query: () => "/dashboard", this arrow function tells redux wen someone calls getDashBoardMetrics, render the /dashboard enpoint


// redux toolkit automatically create react hooks for every endpoint that we define. since we created an getDashmetrics, redux creates an hook get useGetDasboardMetrics that we can use in our components (for tat enpoint) for fetching data
    // const { data, error, isLoading } = useGetDashboardMetricsQuery(); for example this snippet of code handles all this information for us

