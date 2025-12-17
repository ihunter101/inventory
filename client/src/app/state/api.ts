import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { url } from "inspector";
import page from "../(private)/sales/page";

// ----------------------
// Interfaces
// ----------------------

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
}

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

export interface NewProduct {
  name: string;
  price: number;
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

export interface DashboardMetrics {
  popularProducts: Product[];
  salesSummary: SalesSummary[];
  purchaseSummary: PurchaseSummary[];
  expenseSummary: ExpenseSummary[];
  expenseByCategorySummary: ExpenseByCategorySummary[];
}

export interface User {
  clerkId: string;
  id: string;
  name: string;
  email: string;
  role: string;
  location: string;
  createdAt: string;
  lastLogin: string;
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
  items: POItem[]
  subtotal: number;
  tax: number;
  total: number;
  category?: string;
  invoiceCount?: number;
}

export interface NewPurchaseOrderDTO {
  // server can assign this if you omit it
  poNumber?: string;

  orderDate: string; // problem
  dueDate?: string; //
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
  draftProductId: string;
  productId: string | null;
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
  draftProductId: string;
  //sku?: string;
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




// ----------------------
// API Setup
// ----------------------

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    credentials: "include", //for authentication and authorization 
  }),
  tagTypes: [
    "DashboardMetrics", "Products", "Users", "Expenses",
    "PurchaseOrders", "SupplierInvoices", "GoodsReceipts", "Suppliers", "Inventory", "DraftProducts"
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
      providesTags: ["Products"],
    }),
    createProduct: build.mutation< Product, NewProduct>({
      query: (newProduct) => ({
        url: "/products",
        method: "POST",
        body: newProduct,
      }),
      invalidatesTags: ["Products", "Inventory"],
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
  invalidatesTags: (_r, _e, { id }) => [{ type: "PurchaseOrders", id }],
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
  query: (body) => ({ 
    url: "/grns",
    method: "POST", 
    body 
  }),
  invalidatesTags: ["GoodsReceipts", "PurchaseOrders"],
}),
postGRN: build.mutation<{ ok: true }, { id: string }>({
  query: ({ id }) => ({
    url: `/grns/${id}/post`, 
    method: "POST" 
  }),
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

  }),
});

// ----------------------
// Hooks
// ----------------------

export const {
  useGetDashboardMetricsQuery,
  useGetProductsQuery,
  useGetInventoryQuery,
  useCreateProductMutation,
  useGetUsersQuery,

  useAdjustInventoryMutation,
  useSetInventoryMutation,

  useGetExpensesQuery,
  useCreateExpenseMutation,

  useGetSuppliersQuery,

  useListPurchaseOrderQuery,
  useGetPurchaseOrderQuery,
  useGetPurchaseOrdersQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderStatusMutation,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation,

  useGetSupplierInvoicesQuery,
  useCreateSupplierInvoiceMutation,
  useMarkInvoicePaidMutation,

  useGetGoodsReceiptsQuery,
  useCreateGRNMutation,
  usePostGRNMutation,

  useCreateDraftProductMutation,
  useGetDraftProductsQuery,
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

