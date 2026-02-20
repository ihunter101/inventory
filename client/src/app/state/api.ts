import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { url } from "inspector";
import page from "../(private)/sales/page";
import { FulfillStockRequestResponse, Paginated, ReviewStockRequestBody, StockRequestDetailResponse, StockRequestListQuery, StockRequestListResponse, StockRequestStatus } from "./stockSheetSlice";
import { parseAppSegmentConfig } from "next/dist/build/segment-config/app/app-segment-config";
import { Role } from "@lab/shared/userRoleUtils";
import { string } from "zod";

// ----------------------
// Interfaces
// ----------------------

//------------------------
// DashboardMetrics types
//------------------------

export type DateRange = "7d" | "30d" | "90d" | "1y";

export interface RevenueAndProfitData {
  chartData: Array<{
    date: string;
    revenue: number;
    regularExpenses: number;
    invoiceExpenses: number;
    totalExpenses: number;
    profit: number;
  }>;
  summary: {
    totalRevenue: number;
    totalRegularExpenses: number;
    totalInvoiceExpenses: number;
    totalExpenses: number;
    totalProfit: number;
    profitMargin: number;
    revenueTrend: number | null;
    profitTrend: number | null;
    transactionCounts: {
      salesCount: number;
      expenseCount: number;
      invoiceCount: number;
    };
  };
  topExpenseCategories: Array<{
    category: string;
    amount: number;
  }>;
}

export interface PurchaseBreakdownCategory {
  category: string;
  amount: number;
}

export interface PurchaseBreakdownDepartment {
  department: string;
  amount: number;
}

export interface PurchaseBreakdownProduct {
  productId: string;
  name: string;
  amount: number;
}

export interface PurchaseBreakdown {
  total: number;
  byCategory: PurchaseBreakdownCategory[];
  byDepartment: PurchaseBreakdownDepartment[];
  topProducts: PurchaseBreakdownProduct[];
}

export interface ProductResponse {
  items: Product[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  previousPage: number | null;
}

interface GetProductsArgs {
  page?: number;
  search?: string;
  department?: string;
}

export interface Product {
  productId: string;
  name: string;
  price: number;
  rating?: number;
  stockQuantity: number;
  unit?: string; //added only to assist in the CreatePruchasreOrderModal
  imageUrl?: string;
  department?: string;
  category?: string;
}
export type ProductDTO = {
  productId: string;
  name: string;
  // price?: number; // keep only if your Prisma model actually has it
  rating?: number | null;
  stockQuantity: number;
  minQuantity?: number | null;
  reorderPoint?: number | null;
  category?: string | null;
  unit?: string | null;
  supplier?: string | null;
  expiryDate?: string | null; // ISO string
  imageUrl?: string | null;
  Department?: string | null;
  sku?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type UpdateProductDTO = Partial<Omit<ProductDTO, "productId" | "createdAt" | "updatedAt">>;

export interface ProductDraft {
  id: string; 
  name: string;
  unit: string;
}

export interface Inventory {
  id: string 
  productId: string; 
  name: string;
  unit?: string | null;
  supplier?: string | null;
  expiryDate?: string | null;
  stockQuantity: number;
  minQuantity: number;
  reorderPoint: number;
  lastCounted: string;
}

type UpdateInventoryMetaPayload = {
  productId: string;
  expiryDate?: string | null; // ISO string or null
  minQuantity?: number;
  reorderPoint?: number;
};

export interface NewProduct {
  name: string;
  rating?: number;
  stockQuantity: number;
  unit?: string;
  // TODO: add unit an a cumpulsoary ptop but it may affect other places we we use createProduct hook fomr useCreateProductMutation
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

export interface PurchaseMetrics {
  totalPOs: number;
  closedPOs: number;
  activePOs: number;
  totalInvoices: number;
  pendingInvoices: number;
  paidInvoices: number;
  pendingInvoicesAmount: number;
  paidInvoicesAmount: number;
  totalInvoicesAmount: number;
}
export interface DashboardMetrics {
  popularProducts: Product[];
  salesSummary: Sales[];
  purchaseSummary: SupplierInvoiceDTO[];
  purchaseBreakdown: PurchaseBreakdown  // ✅ Single object, not array
  expenseSummary: Expense[]
  revenueAndProfit: Record<DateRange, RevenueAndProfitData>
  expenseByCategorySummary: ExpenseByCategorySummary[];
  PurchaseMetrics: PurchaseMetrics;
}
export type ExpenseGroup = 
  |"Clinical" 
  | "Equipment and Infrastructure"
  | "Logistics and Overhead"
  | "Other"


  
export interface Expense {
  expenseId: string;
  category: string;
  group: ExpenseGroup;
  amount: number;
  date: string;
  status: string;
  description?: string; 
  title?: string
  // sourceType?: "PurchaseOrder" | "Manual";
  // sourceId?: string;
};



export interface Supplier {
  supplierId: string 
  name: string;
  email?: string; 
  phone?: string; 
  number?: string;
}

export type POStatus =
  | "DRAFT" | "APPROVED" | "SENT" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CLOSED";
export type InvoiceStatus = "PENDING" | "PAID" | "OVERDUE" | "READY_TO_PAY" | "PARTIALLY_PAID" | "VOID";
export type GRNStatus = "DRAFT" | "POSTED";

export interface POItem {
  id?: string;
  poItemId?: string;
  productId?: string;
  draftProductId: string;
  sku?: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;

  // ✅ computed fields (server-returned)
  orderedQty?: number;
  invoicedQty?: number;
  remainingToInvoice?: number;
  fullyInvoiced?: boolean;
}

export interface SupplierDTO {
  supplierId: string;
  name: string;
  email: string;
  phone: string; //store in prisma as a string for some reason
  address: string;
}

export interface PurchaseOrderDTO {
  id: string;
  poNumber: string;
  supplierId: string;
  supplier?: SupplierDTO;
  status: POStatus;
  orderDate: string;
  dueDate?: string;
  notes?: string;
  items: POItem[];
  subtotal: number;
  tax: number;
  total: number;
  category?: string;
  invoiceCount?: number;

  // computed
  hasRemainingToInvoice?: boolean;
  remainingToInvoiceCount?: number;
  remainingToInvoiceQty?: number;
}

export interface NewPurchaseOrderDTO {
  // server can assign this if you omit it
  poNumber?: string;

  orderDate: string | Date; // problem
  dueDate?: string | Date; //
  notes?: string; //

  items: POItem[]; //unsure
  subtotal: number;
  tax: number; //
  total: number; //

  status?: POStatus;   // optional – server can default to "DRAFT"
  //category?: string;

  // OPTION 1: existing supplier
  supplierId?: string; //

  // OPTION 2: create a new supplier inline
  supplier?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
}


export interface InvoiceLine {
  id: string;  //added
  draftProductId: string;
  productId: string | null;
  poItemId?: string;
  sku?: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
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
  balanceRemaining?: number;
}

export interface CreateSupplierInvoiceDTO {
  invoiceNumber: string;
  supplierId: string;
  poId?: string;
  date?: string;
  dueDate?: string;
  lines: Array<{
    draftProductId: string;
    poItemId?: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    description?: string;
  }>;
}


export interface GoodsReceiptLine {
  productDraftId: string;
  //sku?: string;
  productId?: string;
  poItemId?: string;
  name: string;
  unit: string;
  receivedQty: number;
  unitPrice?: number;
  invoiceItemId?: string;
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
  notes?: string;
}
export interface CreateGRNDTO {
  poId: string;
  invoiceId?: string;
  date?: string;
  grnNumber: string;
  lines: Array<{
    invoiceItemId?: string;
    productDraftId: string;
    poItemId?: string;
    receivedQty: number;
    unitPrice?: number;
    unit: string;
  }>;
}


// shared core fields the form always sends
export type POBaseInput = {
  id?: string; // optional – create won’t use it
  poNumber: string;
  orderDate: string;
  dueDate?: string;
  notes?: string;
  items: {
    productId: string;
    name: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  status?: POStatus; // only if you want to send it from the form
};

// case 1: use an existing supplier
export type ExistingSupplierPOInput = POBaseInput & {
  supplierId: string;
};

// case 2: create a new supplier inline
export type NewSupplierPOInput = POBaseInput & {
  supplier: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
};

export type PurchaseOrderFormPayload =
  | ExistingSupplierPOInput
  | NewSupplierPOInput;

  export interface User {
    id: string;
    clerkId: string;
    name: string | null;
    email: string;
    role: Role;
    location: string;
    createdAt: string;
    lastLogin: string;
    onboardedAt: string;
  };

  export type DraftProductDTO = {
  id: string;
  name: string;
  unit: string;
  createdAt: string;   // ISO
  updatedAt: string;   // ISO
  receivedQty: number;
  grnCount?: number;        // optional: how many GRNs
  grnNumbers?: string[];
};

export interface Sales {
  id: number;
  locationId: number;
  salesDate: string;
  hundredsCount: number;
  fiftiesCount: number;
  twentiesCount: number;
  tensCount: number;
  fivesCount: number;
  cashTotal: string;
  grandTotal: string;
  creditCardTotal: string;
  debitCardTotal: string;
  chequeTotal: string;
  notes?: string;
  enteredBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleInput {
  salesDate: string;
  hundredsCount: number;
  fiftiesCount: number;
  twentiesCount: number;
  tensCount: number;
  fivesCount: number;
  cashTotal: number;
  creditCardTotal: number;
  debitCardTotal: number;
  chequeTotal: number;
  grandTotal: number;
  notes?: string;
}

export interface SalesAnalytics {
  sales: Sales[];
  analytics: {
    totalSales: number;
    totalCash: number;
    totalCard: number;
    salesByLocation: Array<{
      locationId: number; // ✅ was string
      totalSales: number;
      count: number;
    }>;
  };
}


export interface GetSalesParams {
  startDate?: string;
  endDate?: string;
  locationId?: number; // ✅ optional
}


interface PostGRNResponse {
  ok: boolean;
  grnId: string;
  poId: string;
}

export type MatchStatus = "DRAFT" | "READY_TO_PAY" | "PAID" | "VOID";

export type MatchLineDTO = {
  id: string;
  matchId: string;

  poItemId?: string | null;
  invoiceItemId?: string | null;
  grnLineId?: string | null;

  name: string;
  sku?: string | null;
  unit?: string | null;

  poQty: number;
  grnQty: number;
  invUnitPrice: number | null;

  payableQty: number;
  payableAmount: number;

  notes?: string | null;
};

export type MatchDTO = {
  id: string;
  poId: string;
  invoiceId: string;
  grnId: string;
  status: MatchStatus;

  payableTotal: number;
  currency?: string | null;

  createdAt: string;
  updatedAt: string;

  lines: MatchLineDTO[];
};

export type CreateMatchDTO = {
  poId: string;
  invoiceId: string;
  grnId: string;
};

export type PaymentStatus = "POSTED" | "VOID"

export type CreateInvoicePaymentBody =
  Omit<Partial<InvoicePaymentDTO>, "amount"> & { amount: number };

export type InvoicePaymentDTO = {
  id: string; 
  invoiceId: string;
  poId?: string | null; // optional for now
  amount: string;
  currency: string | null; //optional for now
  paidAt: string; 
  method?: string | null; //optional for now 
  reference?: string | null; //optional for now
  notes?: string | null; //optional for now
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}
export type InvoicePaymentWithInvoiceDTO = InvoicePaymentDTO & {
  invoice: {
    id: string;
    invoiceNumber: string;
    balanceRemaining: string | null;
    poId: string | null;
  };
};

export type PoPaymentSummaryDTO = {
  poId: string;
  totalPayable: number;
  totalPaid: number;
  outstanding: number;
};

export type AllPoPaymentSummary = {
  totalPayble: number;
  totalPaid: number;
  outstanding: number;
  paidAt: string;
}

export type InvoicePaymentSummaryDTO = {
  invoiceId: string;
  payableTotal: number;
  paidTotal: number;
  outstanding: number
  matchStatus: "DRAFT" | "READY_TO_PAY" | "PAID" | "VOID" | null;
}


// ----------------------
// API Setup
// ----------------------

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    credentials: "include", //for authentication and authorization ,
    prepareHeaders: async (headers) => {
      if (typeof window !== 'undefined') {
        const token = await window.Clerk?.session?.getToken();
        if (token) {
          headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
      }
    }
  }),
  tagTypes: [
    "DashboardMetrics", "Products", "Users", "Expenses",
    "PurchaseOrders", "SupplierInvoices", "GoodsReceipts", 
    "Suppliers", "Inventory", "DraftProducts", "StockSheet",
    "SalesAnalytics", "TodaySale", "Sales", "Matches", "InvoicePayments", 
    "PoPaymentSummary"
  ],
  endpoints: (build) => ({
    // Dashboard Metrics
    getDashboardMetrics: build.query<DashboardMetrics, void>({
      query: () => "/dashboard",
      providesTags: ["DashboardMetrics"],
    }),
    // Inventory
    getInventory: build.query<Inventory[], string | void>({
    query: (search) => ({
      url: "/inventory",  // Points to your new inventory route 
      params: search ? { search } : {},
      }),
    providesTags: (rows) =>
    rows
      ? [
          { type: "Inventory" as const, id: "LIST" },
          ...rows.map(r => ({ type: "Inventory" as const, id: r.productId })),
        ]
      : [{ type: "Inventory" as const, id: "LIST" }],
      }),
    getInventoryWithoutExpiryDate: build.query<Inventory[], void>({
      query: () => ({
        url: 'inventory/expiry'
      }),
      providesTags: [{ type: "Inventory", id: "LIST"}]
    }),
    adjustInventory: build.mutation<Inventory, { productId: string; delta: number; reason?: string }>({
      query: (body) => ({
        url: "/inventory/adjust",
        method:"POST",
        body, //{productId, delta, reason}
      }),
      async onQueryStarted({productId, delta}, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          api.util.updateQueryData("getInventory", undefined, draft => {
            const row = draft.find(r => r.productId === productId);
            if (row) row.stockQuantity += delta;
          })
        );
        try { await queryFulfilled;} catch { patch.undo();}
      },
      invalidatesTags: (_res, _err, {productId}) => [
        { type: "Inventory", id: productId },
        { type: "Products", id: productId },
      ]
    }),

    setInventory: build.mutation<Inventory, {productId: string; stockQuantity: number; lastCounted?: string}>({
      query: (body) => ({
        url: "/inventory/set",
        method: "POST",
        body, //{ productId, stockQuantity, lastCounted}
      }),
      invalidatesTags: (_res, _err, {productId }) => [
        { type: "Inventory", id: productId },
        { type: "Products", id: productId },
      ],
    }),
    updateInventoryMeta: build.mutation<Inventory, UpdateInventoryMetaPayload>({
      query: ({ productId, ...body }) => ({
        url: `inventory/${productId}/meta`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "Inventory", id: "LIST" }],
    }),
    // Products
    getProducts: build.query<ProductResponse, GetProductsArgs | void>({
      query: (args) => {
        const params: Record<string, any> = {};
  
        if (args?.page) params.page = args.page;
        if (args?.search) params.search = args.search;
        if (args?.department) params.department = args.department;
        
        return {
          url: "/products",
          params,
          
        }
        
      },
      providesTags: (res) => res?.items
      ? [
          { type: "Products", id: "LIST" },
          ...res.items.map((p: any) => ({ type: "Products" as const, id: p.productId })),
        ]
      : [{ type: "Products", id: "LIST" }],
    }),
    createProduct: build.mutation< Product, NewProduct>({
      query: (newProduct) => ({
        url: "/products",
        method: "POST",
        body: newProduct,
      }),
      invalidatesTags: ["Products", "Inventory"],
    }),
    getProductById: build.query<ProductDTO, string>({
      query: (productId) => ({ url: `/products/${productId}` }),
      providesTags: (_res, _err, productId) => [{ type: "Products", id: productId }],
    }),

    updateProduct: build.mutation<ProductDTO, { productId: string; body: UpdateProductDTO }>({
      query: ({ productId, body }) => ({
        url: `/products/${productId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_res, _err, { productId }) => [
        { type: "Products", id: productId },
        { type: "Products", id: "LIST" },
        "Products",
      ],
    }),
    getPendingArrivals: build.query<DraftProductDTO[], { grnId: string }>({
      query: ({ grnId }) => `/draft-products/pending-arrivals?grnId=${encodeURIComponent(grnId)}`,
      providesTags: [{ type: "DraftProducts", id: "PENDING_ARRIVALS" }],
    }),
    finalizedProduct: build.mutation<Product, Partial<Product>>({
      query: ({ productId, ...patch}) => ({
        url: `products/${productId}/finalize`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: [{ type: "Products", id: "LIST" }, { type: "Inventory", id: "LIST" }]
    }),
    getPendingPromotionsCount: build.query<{ count: number }, void>({
      query: () => "/draft-products/pending-promotions/count",
      providesTags: [{ type: "DraftProducts", id: "PENDING_COUNT" }],
    }),
    getPendingPromotions: build.query<DraftProductDTO[], { grnId?: string } | void>({
      query: (arg) => {
        const grnId = arg && typeof arg === 'object' ? arg.grnId : undefined;
        return grnId
          ? `/draft-products/pending-promotions?grnId=${encodeURIComponent(grnId)}`
          : `/draft-products/pending-promotions`;
      },
      providesTags: [{ type: "DraftProducts", id: "PENDING_LIST" }],
    }),
    bulkFinalizeProducts: build.mutation<any, { updates: Array<any> }>({
      query: (body) => ({
        url: "/draft-products/bulk-finalize",
        method: "POST",
        body,
      }),
      invalidatesTags: ["DraftProducts", "Products", "Inventory"],
    }),
    // Users
    getUsers: build.query<User[], void>({
      query: () => "/users",
      providesTags: [{ type: "Users", id: "LIST"} ],
    }),
    getUserById: build.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_results, _err, id) => [{ type: "Users", id: "LIST"}, { type: "Users", id}]
    }),
    getMe: build.query<{ user: User }, void>({
      query: () => "/users/me",
      providesTags: [{ type: "Users", id: "ME" }],
    }),

    updateUser: build.mutation<User, { id: string; name?: string; location?: string }>({
      query: ({ id, ...body }) => ({
      url: `/users/${id}`,
      method: "PATCH",
      body, // body will be { name?: string; location?: string }
    }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "Users", id: "LIST" },
        { type: "Users", id },
      ],
  }),
    updateUserRole: build.mutation<User, { id: string, role: Role }>({
      query: ({ id, role }) => ({
        url: `/users/${id}/role`,
        method: "PATCH",
        body: { role }
      }),
      invalidatesTags: (_result, _err, {id}) => [{type: "Users", id: "LIST"}, { type: "Users", id}]
    }),
    deleteUser: build.mutation<{success: boolean, message: string}, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_results, _err, id) => [{ type: "Users", id: "LIST"}, { type: "Users", id}]
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
    query: (params) => ({
      url: "/purchase-orders", 
      params: params ?? undefined
    }),
    providesTags: [{type: "PurchaseOrders", id: "LIST"}],
  }), 
  getPurchaseOrder: build.query<PurchaseOrderDTO, string>({
    query: (poId) => `/purchase-orders/${poId}`,
    providesTags: (_r, _e, id) => [{ type: "PurchaseOrders", id }],
  }),
  getPurchaseOrderById: build.query<any, string>({
    query: (id) => ({
      url: `/purchase-orders/${id}`,
      method: "GET",
    }),
    providesTags: (_res, _err, id) => [{ type: "PurchaseOrders", id }],
  }),
  listPurchaseOrder: build.query<PurchaseOrderDTO[], { q?: string } | void>({
    query: (arg) => ({
      url: "/purchase-orders",
      params: arg && arg?.q ? {q: arg.q} : undefined
    }),
    providesTags: [{ type: "PurchaseOrders", id: "LIST" }],
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
    invalidatesTags: (_r, _e, { id }) => [{ type: "PurchaseOrders", id: "LIST"}],
  }),
  updatePurchaseOrder: build.mutation<PurchaseOrderDTO,{ id: string } & Partial<NewPurchaseOrderDTO>>({
  query: ({ id, ...body }) => ({
    url: `/purchase-orders/${id}`,
    method: "PATCH",
    body,
  }),
  invalidatesTags: (_r, _e, { id }) => [{ type: "PurchaseOrders", id }, { type: "PurchaseOrders", id: "LIST" }],
}),
  deletePurchaseOrder: build.mutation<void, { id: string }>({
    query: ({ id }) => ({
      url: `/purchase-orders/${id}`,
      method: "DELETE",
    }),
    invalidatesTags: [{type: "PurchaseOrders", id: "LIST"}],
  }),
  // SupplierInvoice
  getSupplierInvoices: build.query<SupplierInvoiceDTO[], { status?: InvoiceStatus; q?: string } | void>({
  query: (params) => ({ url: "/invoices", params: params ?? undefined }),
  providesTags: (result) =>
    result
      ? [
          { type: "SupplierInvoices", id: "LIST" },
          ...result.map((inv) => ({ type: "SupplierInvoices" as const, id: inv.id })),
        ]
      : [{ type: "SupplierInvoices", id: "LIST" }],
}),

  getSupplierInvoice: build.query<SupplierInvoiceDTO, string>({
  query: (id) =>  `/invoices/${id}`,
  providesTags: (_results, _error, id) => [
    { type: "SupplierInvoices", id },
    { type: "SupplierInvoices", id: "LIST"}
  ]
}),
  createSupplierInvoice: build.mutation<SupplierInvoiceDTO, CreateSupplierInvoiceDTO>({
    query: (body) => ({ url: "/invoices", method: "POST", body}),
    invalidatesTags: [{ type: "SupplierInvoices", id: "LIST"}, "SupplierInvoices", "PurchaseOrders", "DashboardMetrics"],
  }),
  //MAY DELETE THIS 
  markInvoicePaid: build.mutation<SupplierInvoiceDTO, { id: string }>({
  query: ({ id }) => ({ url: `/invoices/${id}/status`, method: "PATCH" }),
  invalidatesTags: (_r, _e, { id }) =>
    [{ type: "SupplierInvoices", id }, { type: "SupplierInvoices", id: "LIST"}],
}),
  deleteSupplierInvoice: build.mutation<void, {id: string}>({
    query: ({id}) => ({
      url: `/invoices/${id}`,
      method: "DELETE",
    }),
    invalidatesTags: [{ type: "SupplierInvoices", id: "LIST"}]
  }),
  updateSupplierInvoice: build.mutation<SupplierInvoiceDTO, { id: string } & Partial<SupplierInvoiceDTO>>({
  query: ({ id, ...body }) => ({
    url: `/invoices/${id}`,
    method: "PATCH",
    body, // Make sure body is here!
  }),
  invalidatesTags: (_results, _error, { id }) => [
    { type: "SupplierInvoices", id }, // Invalidate specific invoice
    { type: "SupplierInvoices", id: "LIST" }, // Invalidate list
  ],
}),
  updateInvoiceStatus: build.mutation<any, { id: string; status: string }>({
    query: ({ id, ...body }) => ({
      url: `/invoices/${id}/status`, // make sure this matches your Express route
      method: "PATCH",
      body,
    }),
    invalidatesTags: (_err, _res, { id }) => [
      { type: "SupplierInvoices", id },
      { type: "SupplierInvoices", id: "LIST" }
    ],
  }),
  // Goods Receipt
  searchGoodsReceipts: build.query<GoodsReceiptDTO[], { q?: string } | void>({
  query: (params) => ({ url: "/grns", params: params ?? undefined }),
  providesTags: ["GoodsReceipts", "PurchaseOrders"],
}),
listGoodsReceipts: build.query<GoodsReceiptDTO[], void>({
  query: () => ({ url: "/grns" }),
  providesTags: (result) =>
    result
      ? [
          ...result.map(({ id }) => ({ type: "GoodsReceipts" as const, id })),
          { type: "GoodsReceipts", id: "LIST" },
        ]
      : [{ type: "GoodsReceipts", id: "LIST" }],
}),
getGoodsReceipt: build.query<GoodsReceiptDTO,  string>({
  query: (id) => ({ url: `/grns/${id}` }),
  providesTags: (_result, _error, id) => [{ type: "GoodsReceipts", id }],
}),
createGRN: build.mutation<GoodsReceiptDTO, CreateGRNDTO>({
  query: (body) => ({ 
    url: "/grns",
    method: "POST", 
    body 
  }),
  invalidatesTags: ["GoodsReceipts", "PurchaseOrders"],
}),
postGRN: build.mutation<PostGRNResponse, { id: string }>({
  query: ({ id }) => ({
    url: `/grns/${id}/post`,
    method: "POST",
  }),
  invalidatesTags: (result, error, { id }) => [
    { type: "GoodsReceipts", id },
    { type: "GoodsReceipts", id: "LIST" },
    { type: "PurchaseOrders", id: result?.poId },
    { type: "PurchaseOrders", id: "LIST" },
  ],
}),
updateGRN: build.mutation<GoodsReceiptDTO, { id: string } & Partial<GoodsReceiptDTO>>({
  query: ({ id, ...body }) => ({
    url: `/grns/${id}`,
    method: "PUT",
    body,
  }),
  invalidatesTags: (_result, _error, { id }) => [
    { type: "GoodsReceipts", id },
    { type: "GoodsReceipts", id: "LIST" },
  ],
}),
deleteGoodsReceipt: build.mutation<void, {id: string}> ({
  query: ({id}) => ({
    url: `/grns/${id}`,
    method: "DELETE"
  }),
  invalidatesTags: (result, err, {id}) => [{ type: "GoodsReceipts", id: "LIST"}, { type: "GoodsReceipts", id}]
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

  getDraftProducts: build.query<{ id: string; name: string; unit: string }[], void>({
      query: () => "/draft-products",
      providesTags: (result) =>
        result
          ? [
              ...result.map((d) => ({ type: "DraftProducts" as const, id: d.id })),
              { type: "DraftProducts" as const, id: "LIST" },
            ]
          : [{ type: "DraftProducts" as const, id: "LIST" }],
    }),
  createDraftProduct: build.mutation<{ id: string; name: string; unit: string }, { name: string; unit?: string }>({
      query: (body) => ({
        url: "/draft-products",
        method: "POST",
        body,
    }),
}),
  createStockSheet: build.mutation<{id: string, status: string, submittedAt: string}, {lines: Array<{productId: string, requestedQty: number}>}>({
    query: (body) => ({
      url: "/stock-requests",
      method: "POST",
      body,
    }),
    invalidatesTags: [{ type: "StockSheet", id: "LIST"}]
  }),

  listStockRequests: build.query<StockRequestListResponse, StockRequestListQuery>({
    query: (args) => {
      const params: Record<string, any> = {
        page: args.page,
        pageSize: args.pageSize ?? 20,
      };

      if (args.location) params.location = args.location;
      if (args.status) params.status = args.status;
      if (args.search?.trim()) params.search = args.search.trim();

      return {
        url: "/stock-requests",
        params,
        method: "GET",
      };
    },
    providesTags: [{ type: "StockSheet", id: "LIST" }],
  }),
  getStockRequestById: build.query<StockRequestDetailResponse, string>({
    query: (id) => ({
      url: `/stock-requests/${id}`,
      method: "GET"
    }),
    providesTags: (results, _err, id) => [{ type: "StockSheet", id}, { type: "StockSheet", id: "LIST"}]
  }),
  reviewStockRequest: build.mutation<{ ok: boolean}, ReviewStockRequestBody>({
    query: ({ id, body}) => ({
      url: `/stock-requests/${id}/review`,
      method: "PATCH",
      body,
    }),
    invalidatesTags: (_res, _err, arg) => [
      { type: "StockSheet", id: arg.id},
      { type: "StockSheet", id: "LIST"}
    ],
  }),
  fulfillStockRequest: build.mutation<FulfillStockRequestResponse, string>({
    query: (id) => ({
      url: `/stock-requests/${id}/fulfill`, 
      method: "POST", 
    }),
    invalidatesTags: (_res, _err, id) => [
      { type: "StockSheet", id },
      { type: "StockSheet", id: "LIST" },
    ],
  }),
  createSale: build.mutation<{ sale: Sales; message: string }, CreateSaleInput>({
  query: (saleData) => ({
    url: "/sales",
    method: "POST",
    body: saleData,
  }),
  invalidatesTags: [
    { type: "Sales", id: "LIST" },
    { type: "TodaySale", id: "SINGLE" },
    { type: "SalesAnalytics", id: "LIST" },
  ],
}),

updateSale: build.mutation<{ sale: Sales; message: string },{ id: number; data: CreateSaleInput }
>({
  query: ({ id, data }) => ({
    url: `/sales/${id}`,
    method: "PATCH",
    body: data,
  }),
  invalidatesTags: [
    { type: "Sales", id: "LIST" },
    { type: "TodaySale", id: "SINGLE" },
    { type: "SalesAnalytics", id: "LIST" },
  ],
}),

getSalesByLocation: build.query<{ sales: Sales[] }, GetSalesParams>({
  query: (params) => ({
    // ✅ if your backend uses user.location, you likely want just "/sales/location"
    url: `/sales/location`,
    params: {
      startDate: params.startDate,
      endDate: params.endDate,
    },
  }),
  providesTags: [{ type: "Sales", id: "LIST" }],
}),

getTodaySale: build.query<{ sale: Sales | null }, void>({
  query: () => "/sales/today",
  providesTags: [{ type: "TodaySale", id: "SINGLE" }],
}),

getSalesAnalystics: build.query<SalesAnalytics, GetSalesParams>({
  query: (params) => ({
    url: "/sales/analytics",
    params, // { startDate, endDate, locationId? }
  }),
  providesTags: [{ type: "SalesAnalytics", id: "LIST" }],
}),

deleteSale: build.mutation<{ message: string }, number>({
  query: (id) => ({
    url: `/sales/${id}`, // ✅ missing slash fixed
    method: "DELETE",
  }),
  invalidatesTags: [
    { type: "Sales", id: "LIST" },
    { type: "TodaySale", id: "SINGLE" },
    { type: "SalesAnalytics", id: "LIST" },
  ],
}),
createMatch: build.mutation<MatchDTO, CreateMatchDTO>({
  query: (body) => ({
    url: "/matches",
    method: "POST",
    body,
  }),
  invalidatesTags: [{ type: "Matches", id: "LIST" }, { type: "SupplierInvoices"}],
}),

getMatchById: build.query<MatchDTO, string>({
  query: (id) => ({ url: `/matches/${id}` }),
  providesTags: (_res, _err, id) => [{ type: "Matches", id }],
}),
updateMatchStatus: build.mutation<MatchStatus, {id: string; status: MatchStatus}>({
  query: ({id, status}) => ({
    url: `/matches/${id}`,
    method: "PATCH",
    body: {status}
  }),
  invalidatesTags: (_err, _res, { id }) => [ { type: "Matches", id: "LIST" } ]
}),
addInvoicePayment: build.mutation<InvoicePaymentDTO, { invoiceId: string; body: CreateInvoicePaymentBody}>({
  query: ({ invoiceId, body }) => ({
    url: `/invoices/${invoiceId}/payments`,
    method: "POST",
    body,
  }),
  invalidatesTags: (_res, _err, args) => [
  { type: "InvoicePayments", id: args.invoiceId },
  { type: "SupplierInvoices", id: args.invoiceId },
],
}),
getInvoicePayments: build.query<InvoicePaymentDTO[], string>({
  query: (invoiceId) => ({
    url: `/invoices/${invoiceId}/payments`,}),
    providesTags: (_res, _err, invoiceId) => [
      { type: "InvoicePayments", id: invoiceId },
      { type: "InvoicePayments", id: "LIST"},
    ],
}),
getPoInvoicePayments: build.query<InvoicePaymentWithInvoiceDTO[], {id: string | undefined }>({
  query: ({id}) => ({
    url: `/purchase-orders/${id}/payments`,
  }),
  providesTags: [ { type: "InvoicePayments", id: "LIST" }, { type: "SupplierInvoices", id:"LIST" } ],
}),
getPoPaymentSummary: build.query<PoPaymentSummaryDTO, string>({
  query: (poId) => `/purchase-orders/${poId}/payments-summary`,
  providesTags: (result, error, poId) => [{ type: "PoPaymentSummary", id: poId }],
}),
getAllPoPaymentsSummary: build.query<AllPoPaymentSummary, void>({
  query: () => "/purchase-orders/payments-summary", 
  providesTags: () => [{ type: "PoPaymentSummary", id: "LIST" }],
}),
  }),
});

// ----------------------
// Hooks
// ----------------------

export const {
  useGetDashboardMetricsQuery,
    
  useGetProductsQuery,
  useGetProductByIdQuery,
  useUpdateProductMutation, 

  useGetPendingArrivalsQuery,
  useFinalizedProductMutation,
  useBulkFinalizeProductsMutation,
  useCreateProductMutation,
  useGetPendingPromotionsCountQuery,
  useGetPendingPromotionsQuery,
  
  useGetUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
  useGetMeQuery,

  useAdjustInventoryMutation,
  useSetInventoryMutation,
  useGetInventoryQuery,
  useGetInventoryWithoutExpiryDateQuery,
  useUpdateInventoryMetaMutation,

  useGetExpensesQuery,
  useCreateExpenseMutation,

  useGetSuppliersQuery,


  useListPurchaseOrderQuery,
  useGetPurchaseOrderQuery,
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderStatusMutation,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation,

  useGetSupplierInvoicesQuery,
  useGetSupplierInvoiceQuery,
  useDeleteSupplierInvoiceMutation,
  useUpdateSupplierInvoiceMutation,
  useCreateSupplierInvoiceMutation,
  //MIGHT DELETE the next line
  useMarkInvoicePaidMutation,
  useUpdateInvoiceStatusMutation,

  useListGoodsReceiptsQuery, 
  useSearchGoodsReceiptsQuery,
  useGetGoodsReceiptQuery, 
  useCreateGRNMutation,
  usePostGRNMutation,
  useUpdateGRNMutation,
  useDeleteGoodsReceiptMutation,

  useCreateDraftProductMutation,
  useGetDraftProductsQuery,

  useCreateStockSheetMutation,
  useListStockRequestsQuery,
  useGetStockRequestByIdQuery,
  useReviewStockRequestMutation,
  useFulfillStockRequestMutation,

  useCreateSaleMutation,
  useUpdateSaleMutation,
  useGetTodaySaleQuery,
  useGetSalesByLocationQuery,
  useGetSalesAnalysticsQuery,
  useDeleteSaleMutation,

  useGetInvoicePaymentsQuery,
  useGetPoPaymentSummaryQuery,
  useGetAllPoPaymentsSummaryQuery,
  useAddInvoicePaymentMutation,
  useGetPoInvoicePaymentsQuery,

  useCreateMatchMutation,
  useGetMatchByIdQuery,
  //MightDelete the line below 
  useUpdateMatchStatusMutation,
} = api;


