import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { url } from "inspector";
import page from "../(private)/sales/page";
import { FulfillStockRequestResponse, Paginated, ReviewStockRequestBody, StockRequestDetailResponse, StockRequestListQuery, StockRequestListResponse, StockRequestStatus } from "./stockSheetSlice";
import { parseAppSegmentConfig } from "next/dist/build/segment-config/app/app-segment-config";
import { Role } from "@lab/shared/userRolesUtils";
import { getClerkToken } from "@/lib/clerkTokenGetter";
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
  lotNumber?: string; //change to be mandetory
}

type UpdateInventoryMetaPayload = {
  productId: string;
  expiryDate?: string | null; // ISO string or null
  minQuantity?: number;
  reorderPoint?: number;
  lotNumber?: string; //update to be mandetory in production 
};

type PaginatedInventoryResponse = {
  data: Inventory[];
  totalPages: number;
  limit: number;
  total: number;
  page: number;
}

type InventoryExpriryParams = {
  page?: number;
  limit?: number;
}

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

export type PopularIssuedProduct = {
  productId: string;
  name: string;
  category?: string | null;
  Department?: string | null;
  unit?: string | null;
  rate: number;
  imageUrl?: string
  qtyIssued: number; // ✅ aggregated sum(grantedQty)
};

export type SalesSummaryKpi = {
  timeframe: "daily" | "weekly" | "monthly";
  total: number;
  cash: number;
  nonCash: number;
  latestChangePercent: number | null;
  trend: { label: string; total: number }[];
};
export interface DashboardMetrics {
  popularIssuedProducts: PopularIssuedProduct[];
  purchaseSummary: SupplierInvoiceDTO[];
  purchaseBreakdown: PurchaseBreakdown  // ✅ Single object, not array
  expenseSummary: Expense[]
  revenueAndProfit: Record<DateRange, RevenueAndProfitData>
  expenseByCategorySummary: ExpenseByCategorySummary[];
  PurchaseMetrics: PurchaseMetrics;
  salesSummary: SalesSummaryKpi;
}
// state/api.ts


export type SalesOverviewTimeframe = "month" | "week";

export type SalesOverviewResponse = {
  tf: SalesOverviewTimeframe;
  rangeLabel: string;
  totals: { total: number; cash: number; nonCash: number };
  highest: { bucketISO: string; total: number } | null;
  sparse: { bucketISO: string; total: number }[];
};

export type PurchaseTF = "day" | "week" | "month" | "quarter";

export type DashboardPurchaseSummaryResponse = {
  timeframe: PurchaseTF;
  rangeLabel: string;
  series: Array<{
    bucketISO: string;
    label: string;
    paid: number; // sum(invoicePayment.amount)
  }>;
  totals: {
    paid: number;
  };
  status: {
    outstanding: number;      // sum of balances of pending invoices
    paid: number;             // sum of amounts of PAID invoices
    invoicesPending: number;
    invoicesPaid: number;
  };
  insights: {
    highest: { label: string; paid: number } | null;
  };
};

export type ProcurementTF = "30d" | "90d" | "1y";

export type ProcurementOverviewResponse = {
  tf: ProcurementTF;
  rangeLabel: string;

  po: {
    total: number;
    closed: number;
    active: number;
    activeValue: number;
    byStatus: Array<{ status: string; count: number; total: number }>;
  };

  invoices: {
    total: number;
    paid: number;
    pending: number;
    paidAmount: number;
    pendingAmount: number;
    totalAmount: number;
    byStatus: Array<{ status: string; count: number; total: number }>;
  };
};
export type ExpenseGroup = 

    "CLINICAL" |
  "EQUIPMENT_INFRASTRUCTURE"  |
  "LOGISTICS_OVERHEAD";

  
export type Expense = {
  expenseId: string;
  companyName?: string | null;
  vendorName?: string | null;
  category: string;
  amount: number;
  currency: string;
  description?: string | null;
  status: "PENDING" | "APPROVED" | "PAID" | "VOID";
  group: "CLINICAL" | "EQUIPMENT_INFRASTRUCTURE" | "LOGISTICS_OVERHEAD";
  invoiceNumber?: string | null;
  referenceNo?: string | null;
  expenseDate?: string | null;
  dueDate?: string | null;
  paidAt?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;

  chequeDraftId?: string | null;
  chequeDraft?: ChequeDraft | null;
  document?: ExpenseDocument[];
};
export type UpdateExpenseStatusRequest = {
  expenseId: string;
  status: "PENDING" | "APPROVED" | "PAID" | "VOID";
};


export interface Supplier {
  supplierId: string 
  name: string;
  email?: string; 
  phone?: string; 
  number?: string;
}

export interface SupplierWithPurchaseOrders extends Supplier {
  address?: string | null;
  createdAt: string;
  updatedAt: string;
  purchaseOrders: {
    orderDate: string;
  }[];
}

export interface GetSuppliersParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetSuppliersResponse {
  suppliers: SupplierWithPurchaseOrders[];
  total: number;
  totalPages: number;
  limit: number;
  page: number;
}

export type SupplierAnalytics = {
  supplier: {
    supplierId: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  };

  kpis: {
    totalInvoiceAmount: number;
    totalPaid: number;
    totalOwed: number;
    totalPurchaseOrderAmount: number;
    totalPurchaseOrders: number;
    totalInvoices: number;
    totalPayments: number;
    paymentRate: number;
    averageDeliveryDays: number | null;
    fastestDeliveryDays: number | null;
    slowestDeliveryDays: number | null;
    overdueInvoiceCount: number;
  };

  invoiceStatusBreakdown: {
    status: string;
    count: number;
    totalAmount: number;
  }[];

  overdueInvoices: {
    id: string;
    invoiceNumber: string;
    amount: number;
    balanceRemaining: number;
    date: string;
    dueDate: string | null;
    status: string;
  }[];

  recentInvoices: {
    id: string;
    invoiceNumber: string;
    amount: number;
    paidAmount: number;
    balanceRemaining: number;
    status: string;
    date: string;
    dueDate: string | null;
  }[];
};

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
  poItemId: string;
  name: string;
  unit: string;
  receivedQty: number;
  unitPrice?: number;
  invoiceItemId: string;
  lotNumber: string;
  expiryDate?: string; 
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
    accessStatus: AccessStatus;
    imageUrl: string
  };

  export type AccessStatus = "pending" | "granted" | "denied"

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

export type QuarterlyReportResponse = {
  quarterName: string;
  aiSummary?: string;
  period: {
    start: string;
    endExclusive: string;
  };
  sales: {
    totalRevenue: number;
    totalCash: number;
    totalCredit: number;
    totalDebit: number;
    totalCheque: number;
    entryCount: number;
    paymentMix: {
      cashPct: number;
      creditPct: number;
      debitPct: number;
      chequePct: number;
    };
  };
  expenses: {
    totalPaidExpenses: number;
    byCategory: Array<{
      category: string;
      total: number;
      count: number;
    }>;
    concentration: {
      topCategoryShare: number;
    };
  };
  purchasing: {
    totalReceivedQty: number;
    totalReceivedValue: number;
    topItems: Array<{
      productId: string;
      productName: string;
      department: string | null;
      totalQty: number;
      totalValue: number;
      avgUnitPrice: number;
    }>;
    byDepartment: Array<{
      department: string;
      totalQty: number;
      totalValue: number;
    }>;
  };
  payables: {
    totalInvoiced: number;
    totalOutstanding: number;
    totalPaid: number;
    paymentsByMethod: Array<{
      method: string;
      total: number;
      count: number;
    }>;
  };
  usage: {
    totalRequestedQty: number;
    totalGrantedQty: number;
    totalUnfulfilledQty: number;
    fillRate: number;
    topIssuedItems: Array<{
      productId: string;
      productName: string;
      department: string | null;
      totalRequestedQty: number;
      totalGrantedQty: number;
      totalUnfulfilledQty: number;
      avgQtyOnHandAtRequest: number;
      estimatedUnitCost: number;
      estimatedCOGS: number;
    }>;
    byLocation: Array<{
      location: string;
      totalRequestedQty: number;
      totalGrantedQty: number;
      totalUnfulfilledQty: number;
      estimatedCOGS: number;
    }>;
  };
  costing: {
    method: string;
    provisionalCOGS: number;
    estimatedGrossProfit: number;
    estimatedGrossMargin: number;
  };
  derivedMetrics: {
    averageRevenuePerSale: number;
    supplierPaymentCoverageRatio: number;
    estimatedOperatingSurplusAfterExpenses: number;
    grossOperatingSurplusUsingPurchasesProxy: number;
    netCashOutflowKnown: number;
  };
  summary: {
    grossOperatingSurplus: number;
    netCashOutflowKnown: number;
  };
  limitations: string[];
};
export type QuarterlyReportRequest = {
  quarter: number;
  year: number;
};

export type CreateMatchDTO = {
  poId: string;
  invoiceId: string;
  grnId: string;
};

export interface PurchaseOrderDetailCount {
  invoices: number;
  grns: number;
}

export interface PurchaseOrderDetailInvoiceItem {
  id?: string;
  poItemId?: string | null;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
  draftProduct?: any;
  product?: any;
  poItem?: any;
}

export interface PurchaseOrderDetailInvoice {
  id: string;
  invoiceNumber: string;
  date?: string | null;
  dueDate?: string | null;
  amount?: number;
  status?: string;
  goodsReceipt?: any;
  items?: PurchaseOrderDetailInvoiceItem[];
}

export interface PurchaseOrderDetailGRNLine {
  id?: string;
  receivedQty?: number;
  quantity?: number;
  product?: any;
  poItem?: any;
  invoiceItem?: any;
}

export interface PurchaseOrderDetailGRN {
  id: string;
  grnNumber?: string;
  date?: string | null;
  status?: string;
  invoice?: any;
  lines?: PurchaseOrderDetailGRNLine[];
}

export interface PurchaseOrderDetailItem extends POItem {
  product?: any;
  promotedProduct?: any;
  invoiceLines?: any[];
  grnLines?: any[];

  orderedQty?: number;
  invoicedQty?: number;
  remainingToInvoice?: number;
  receivedQty?: number;
  pendingQty?: number;
}

export interface PurchaseOrderDetailDTO extends PurchaseOrderDTO {
  _count: PurchaseOrderDetailCount;
  invoices: PurchaseOrderDetailInvoice[];
  grns: PurchaseOrderDetailGRN[];
  items: PurchaseOrderDetailItem[];

  invoiceCount: number;
  grnCount: number;
  invoicedTotal: number;
  receivedQtyTotal: number;
}

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

export type PaymentHistory = {
  id: string;
  invoiceId: string;
  amount: string;
  paidAt: string;
  method?: string | null;
  reference?: string | null;
  notes?: string | null;
  status?: string | null;
  poId?: string | null;
  poNumber?: string | null;
  invoiceNumber?: string | null;
  supplierName?: string | null;
};


type PaginationArgs = {
  page?: number;
  limit?: number;
  search?: string;
};

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  }

}

export interface Organization {
  organizationId: string;
  name: string;
  customerId: string;
  createdAt: string;
  updatedAt: string;

  customer?: {
    customerId: string;
    qbListId?: string | null;
    name: string;
    companyName?: string | null;
    email?: string | null;
    phone?: string | null;
    balance?: number | string | null;
    totalBalance?: number | string | null;
  };

  invoiceSummary?: {
    invoiceCount: number;
    invoiceTotalAmount: number;
    invoiceAmountPaid: number;
    invoiceBalanceRemaining: number;
  };

  users?: {
    id: string;
    name?: string | null;
    email: string;
    role: string;
    accessStatus: string;
  }[];
}

export interface AvailableCustomer {
  customerId: string;
  qbListId?: string | null;
  name: string;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  balance?: number | string | null;
  totalBalance?: number | string | null;
}

export interface CreateOrganizationBody {
  customerId: string;
  name?: string;
}

export interface AssignUserToOrganizationBody {
  userId: string;
  organizationId: string;
}

export interface ClientInvoice {
  invoiceId: string;
  qbTxnId?: string | null;
  qbTxnNumber?: string | null;
  invoiceNumber?: string | null;
  customerName: string;
  subClientName?: string | null;
  invoiceDate?: string | null;
  dueDate?: string | null;
  totalAmount: number | string;
  amountPaid: number | string;
  balanceRemaining: number | string;
  status: string;
  memo?: string | null;
  createdAt: string;
}

export interface ClientInvoiceLine {
  lineId: string;
  invoiceId: string;
  qbTxnLineId?: string | null;
  itemListId?: string | null;
  itemName?: string | null;
  description?: string | null;
  classListId?: string | null;
  className?: string | null;
  quantity?: number | string | null;
  rate?: number | string | null;
  amount?: number | string | null;
  serviceDate?: string | null;
}

export interface ClientInvoiceDetail extends ClientInvoice {
  lines: ClientInvoiceLine[];
  payments: {
    paymentId: string;
    paymentDate: string;
    amount: number | string;
    method?: string | null;
    referenceNumber?: string | null;
    notes?: string | null;
  }[];
  customer?: {
    customerId: string;
    name: string;
    companyName?: string | null;
    email?: string | null;
    phone?: string | null;
  };
}

export interface ClientInvoicesResponse {
  invoices: ClientInvoice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ClientInvoicesParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ClientDashboardResponse {
  organization: {
    organizationId: string;
    name: string;
  };
  customer: {
    customerId: string;
    name: string;
    companyName?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  summary: {
    totalInvoices: number;
    totalBilled: number | string;
    totalPaid: number | string;
    totalOutstanding: number | string;
    openInvoices: number;
  };
  recentInvoices: ClientInvoice[];
}

export interface InviteTokenDTO {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  usedAt?: string | null;
  usedByUserId?: string | null;
  createdByUserId?: string | null;
  createdAt: string;
}

export interface CreateInviteBody {
  organizationId: string;
  email: string;
  role: "clientUser" | "clientAdmin";
}

export interface CreateInviteResponse {
  message: string;
  invite: InviteTokenDTO;
  inviteLink: string;
  emailSent?: boolean;
}

export interface GetOrganizationInvitesResponse {
  invites: InviteTokenDTO[];
}

export interface AcceptInviteBody {
  token: string;
}

export interface AcceptInviteResponse {
  message: string;
  user: any;
  redirectTo: string;
}

export type ExpenseDocumentStatus =
  | "UPLOADED"
  | "PROCESSING"
  | "AI_EXTRACTED"
  | "REVIEWED"
  | "SAVED"
  | "FAILED";

export interface ExtractedExpenseLineItem {
  description: string | null;
  quantity: number | null;
  unitPrice: number | null;
  total: number | null;
}

export interface ExtractedExpenseData {
  category: string;
  amount: number;
  description: string | null;
  group: ExpenseGroup;
  notes: string | null;

  companyName: string | null;
  vendorName: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  dueDate: string | null;

  subtotal: number | null;
  tax: number | null;
  total: number | null;

  confidence: number;
  missingFields: string[];

  lineItems: ExtractedExpenseLineItem[];
}

export interface ExpenseDocument {
  documentId: string;
  uploadThingKey: string;
  fileUrl: string;
  fileName: string;
  mimeType?: string | null;
  sizeBytes?: number | null;

  aiExtractedJson?: ExtractedExpenseData | null;
  aiError?: string | null;
  status: ExpenseDocumentStatus;

  expenseId?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface ExtractExpenseDocumentResponse {
  message: string;
  document: ExpenseDocument;
  extractedData: ExtractedExpenseData;
}


export type SaveExpenseFromDocumentBody = {
  companyName?: string;
  vendorName?: string;
  invoiceNumber?: string;
  expenseDate?: string;
  dueDate?: string;

  category: string;
  amount: number;
  description?: string;
  group: ExpenseGroup;
  notes?: string;
};

export interface SaveExpenseFromDocumentResponse {
  message: string;
  expense: Expense;
  document: ExpenseDocument;
}

export interface CreateExpenseDocumentBody {
  uploadThingKey: string;
  fileUrl: string;
  fileName: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
}

export interface CreateExpenseDocumentResponse {
  message: string;
  document: ExpenseDocument;
}

export type ChequeDraftStatus = "DRAFT" | "READY_FOR_QB" | "MATCHED" | "VOID";

export type ChequePaymentStatus = "ISSUED" | "CLEARED" | "VOID" | "UNKNOWN";


export type ChequePayment = {
  chequePaymentId: string;
  qbTxnId?: string | null;
  qbEditSequence?: string | null;
  payeeName: string;
  chequeNumber?: string | null;
  chequeDate?: string | null;
  amount: string | number;
  accountName?: string | null;
  memo?: string | null;
  status: ChequePaymentStatus;
  source: string;
  rawJson?: string | null;
  lastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChequeDraft = {
  chequeDraftId: string;
  payeeName: string;
  amount: string | number;
  currency: string;
  chequeDate: string;
  memo?: string | null;
  status: ChequeDraftStatus;
  chequePaymentId?: string | null;
  chequePayment?: ChequePayment | null;
  expenses?: Expense[];
  createdAt: string;
  updatedAt: string;
};

export type ChequeDraftExpenseGroup = {
  payeeName: string;
  totalAmount: number;
  expenseCount: number;
  expenses: Expense[];
};

export type CreateChequeDraftBody = {
  payeeName: string;
  expenseIds: string[];
  chequeDate?: string;
  memo?: string;
};

export type CreateChequeDraftResponse = {
  message: string;
  chequeDraft: ChequeDraft;
};

export type VoidChequeDraftResponse = {
  message: string;
  chequeDraft: ChequeDraft;
};

// ----------------------
// API Setup
// ----------------------

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
      prepareHeaders: async (headers) => {
        const token = await getClerkToken();
        if (token) {
          headers.set("authorization", `Bearer ${token}`);
        }
        return headers;
      },
    }),
  tagTypes: [
    "DashboardMetrics", "Products", "Users", "Expenses",
    "PurchaseOrders", "SupplierInvoices", "GoodsReceipts", 
    "Suppliers", "Inventory", "DraftProducts", "StockSheet",
    "SalesAnalytics", "TodaySale", "Sales", "Matches", "InvoicePayments", 
    "PoPaymentSummary", "QuarterlyReport", "PendingAccess", "SuppliersAnalytics",
    "Organizations", "AvailableCustomers", "ClientDashboard", "ClientInvoices",
    "Invites", "ExpenseDocuments", "ChequeDrafts"
  ],
  endpoints: (build) => ({
    // Dashboard Metrics
    getDashboardMetrics: build.query<DashboardMetrics, void>({
      query: () => "/dashboard",
      providesTags: ["DashboardMetrics"],
    }),
    getSalesOverview: build.query<SalesOverviewResponse, { tf?: SalesOverviewTimeframe } | void>({
      query: (params) => ({ 
        url: "/dashboard/sales-overview", 
        params: params ?? undefined }),
      providesTags: ["DashboardMetrics"], // or make a new tag: "SalesOverview"
    }),
    getDashboardPurchaseSummary: build.query<DashboardPurchaseSummaryResponse, { timeframe: PurchaseTF } | void>({
      query: (params) => ({
        url: "/dashboard/purchase-summary",
        params: params ?? { timeframe: "month" },
      }),
      providesTags: ["DashboardMetrics"], // or create ["PurchaseSummary"]
    }),
    getDashboardProcurementOverview: build.query<ProcurementOverviewResponse, { tf: ProcurementTF } | void>({
      query: (params) => ({
        url: "/dashboard/procurement-overview",
        params: params ?? { tf: "30d" },
      }),
      providesTags: ["DashboardMetrics"], // or make "ProcurementOverview"
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
    getInventoryWithoutExpiryDate: build.query<PaginatedInventoryResponse, InventoryExpriryParams>({
      query: ({ page = 1, limit = 15}) => ({
        url: 'inventory/expiry',
        params: {page, limit}
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
reviewUserAccess: build.mutation<
  { message: string; user: User },
  { id: string; token: string; action: "grant" | "deny" }
>({
  query: ({ id, token, action }) => ({
    url: `/users/${id}/review`,
    method: "PATCH",
    body: {
      token,
      action,
    },
  }),
  invalidatesTags: (result, error, arg) => [
    { type: "Users", id: arg.id },
    { type: "Users", id: "LIST" },
    { type: "Users", id: "ME" },
  ],
}),
notifyPendingAccess: build.mutation<{ message: string }, void>({
  query: () => ({
    url: "/users/notify-pending-access",
    method: "POST",
  }),
}),
    // Expenses
    getExpenses: build.query<Expense[], { category?: string; from: string; end: string }>({
    query: (params) => {
        return {
        url: "/expenses",
        params: params ?? undefined, // explicitly ensures correct type
        };
    },
  providesTags: ["Expenses", "DashboardMetrics"],
  }),
  getExpenseById: build.query<Expense, string>({
  query: (expenseId) => `/expenses/${expenseId}`,
  providesTags: (result, error, expenseId) => [
    { type: "Expenses", id: expenseId },
  ],
}),
  updateExpenseStatus: build.mutation<Expense, { expenseId: string; status: Expense["status"] }>({
    query: ({ expenseId, status }) => ({
      url: `/expenses/${expenseId}/status`,
      method: "PATCH",
      body: { status },
    }),
    invalidatesTags: ["Expenses", "DashboardMetrics"],
  }),

  getSuppliers: build.query<GetSuppliersResponse, GetSuppliersParams | void>({
  query: (params) => ({
    url: "/suppliers",
    params: params ?? {}
  }),
  providesTags: ["Suppliers"],
}),
  // Suppliers (basic)
  getSuppliersAnalytics: build.query<SupplierAnalytics, string>({
    query: (supplierId) => `suppliers/${supplierId}/analytics`,
    providesTags: ["SuppliersAnalytics"],
  }),

  // Purchases
 getPurchaseOrders: build.query<PaginatedResponse<PurchaseOrderDTO>, { page?: number; limit?: number; status?: string; q?: string; } | void>({
  query: (params) => ({
    url: "/purchase-orders",
    params: params ?? {},
  }),
  providesTags: [{type: "PurchaseOrders", id: "LIST"} ],
}),
  getPurchaseOrder: build.query<PurchaseOrderDTO, string>({
    query: (poId) => `/purchase-orders/${poId}`,
    providesTags: (_r, _e, id) => [{ type: "PurchaseOrders", id }],
  }),
  getPurchaseOrderById: build.query<PurchaseOrderDetailDTO, string>({
  query: (id) => ({
    url: `/purchase-orders/${id}`,
    method: "GET",
  }),
  providesTags: (_res, _err, id) => [
    { type: "PurchaseOrders", id },
  ],
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
  createStockSheet: build.mutation<{id: string, status: string, submittedAt: string}, {lines: Array<{productId: string; requestedQty: number; qtyOnHandAtRequest: number}>}>({
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
getPaymentHistory: build.query<PaymentHistory[], { invoiceId?: string; poId?: string; q?: string; from?: string; to?: string; method?: string;} | void >({
  query: (params) => ({
    url: "/payments",
    params: params ?? undefined,
  }),
  providesTags: [
    { type: "InvoicePayments", id: "LIST" },
    { type: "SupplierInvoices", id: "LIST" },
  ],
}),
getQuarterlyReport: build.query<QuarterlyReportResponse, void>({
  query: () => ({
    url: "/report/quarterly",
    method: "GET",
  }),
  providesTags: [{ type: 'QuarterlyReport', id: "QUARTERLY" }],
}),
generateAIQuaterlyReport: build.mutation<QuarterlyReportResponse, QuarterlyReportRequest>({
  query: (body) => ({
    url: "ai/quaterly-summary",
    method: "POST",
    body,
  }), 
  invalidatesTags: ['QuarterlyReport']
}),

//quickbooks
getQuickBooksSummary: build.query<any, void>({
  query: () => "/quickbooks/summary",
}),

getQuickBooksCustomers: build.query<
PaginatedResponse<any> & { summary?: any },
  PaginationArgs & { balanceFilter?: "withBalance" | "zeroBalance" | "all" }
>({
  query: ({ page = 1, limit = 10, search = "", balanceFilter = "withBalance" }) => ({
    url: "/quickbooks/customers",
    params: {
      page,
      limit,
      search,
      balanceFilter,
    },
  }),
}),

getQuickBooksCustomerById: build.query<any, string>({
  query: (customerId) => `/quickbooks/customers/${customerId}`,
}),

getQuickBooksInvoices: build.query<PaginatedResponse<any>, PaginationArgs>({
  query: ({ page = 1, limit = 10, search = "" }) => ({
    url: "/quickbooks/invoices",
    params: {
      page,
      limit,
      search,
    },
  }),
}),

getQuickBooksPayments: build.query<PaginatedResponse<any>, PaginationArgs>({
  query: ({ page = 1, limit = 10, search = "" }) => ({
    url: "/quickbooks/payments",
    params: { page, limit, search },
  }),
}),

getQuickBooksCheques: build.query<PaginatedResponse<any>, PaginationArgs>({
  query: ({ page = 1, limit = 10, search = "" }) => ({
    url: "/quickbooks/cheques",
    params: { limit, search, page },
  }),
}),
getQuickBooksInvoiceById: build.query<any, string>({
  query: (invoiceId) => ({
    url: `/quickbooks/invoices/${invoiceId}`,
  }),
}),

forceQuickBooksInvoiceBackfill: build.mutation<{ message: string }, void>({
  query: () => ({
    url: "/quickbooks/invoices/force-backfill",
    method: "POST",
  }),
}),

getOrganizations: build.query<{ organizations: Organization[] }, void>({
  query: () => ({
    url: "/organizations",
    method: "GET",
  }),
  providesTags: ["Organizations"],
}),

getAvailableOrganizationCustomers: build.query<
  { customers: AvailableCustomer[] },
  void
>({
  query: () => ({
    url: "/organizations/available-customers",
    method: "GET",
  }),
  providesTags: ["AvailableCustomers"],
}),

createOrganization: build.mutation<
  { message: string; organization: Organization },
  CreateOrganizationBody
>({
  query: (body) => ({
    url: "/organizations",
    method: "POST",
    body,
  }),
  invalidatesTags: ["Organizations", "AvailableCustomers"],
}),

getOrganizationById: build.query<{ organization: Organization }, string>({
  query: (organizationId) => ({
    url: `/organizations/${organizationId}`,
    method: "GET",
  }),
  providesTags: (result, error, organizationId) => [
    { type: "Organizations", id: organizationId },
  ],
}),

assignUserToOrganization: build.mutation<{ message: string; user: any }, AssignUserToOrganizationBody>({
  query: ({ userId, organizationId }) => ({
    url: `/users/${userId}/organization`,
    method: "PATCH",
    body: { organizationId },
  }),
  invalidatesTags: ["Users", "Organizations"],
}),
getClientDashboard: build.query<ClientDashboardResponse, void>({
  query: () => ({
    url: "/client/dashboard",
    method: "GET",
  }),
  providesTags: ["ClientDashboard"],
}),

getClientInvoices: build.query<ClientInvoicesResponse, ClientInvoicesParams | void>({
  query: (params) => ({
    url: "/client/invoices",
    method: "GET",
    params: params ?? {},
  }),
  providesTags: ["ClientInvoices"],
}),

getClientInvoiceById: build.query<{ invoice: ClientInvoiceDetail }, string>({
  query: (invoiceId) => ({
    url: `/client/invoices/${invoiceId}`,
    method: "GET",
  }),
  providesTags: (result, error, invoiceId) => [
    { type: "ClientInvoices", id: invoiceId },
  ],
}),
createOrganizationInvite: build.mutation<CreateInviteResponse, CreateInviteBody>({
  query: ({ organizationId, email, role }) => ({
    url: `/invites/organizations/${organizationId}`,
    method: "POST",
    body: {
      email,
      role,
    },
  }),
  invalidatesTags: (result, error, arg) => [
    { type: "Invites", id: arg.organizationId },
    "Invites",
  ],
}),

getOrganizationInvites: build.query<GetOrganizationInvitesResponse,string>({
  query: (organizationId) => ({
    url: `/invites/organizations/${organizationId}`,
    method: "GET",
  }),
  providesTags: (result, error, organizationId) => [
    { type: "Invites", id: organizationId },
  ],
}),

acceptInvite: build.mutation<AcceptInviteResponse,AcceptInviteBody>({
  query: (body) => ({
    url: "/invites/accept",
    method: "POST",
    body,
  }),
  invalidatesTags: [
    "Users",
    "Organizations",
    "ClientDashboard",
    "ClientInvoices",
  ],
}),
getExpenseDocumentById: build.query<ExpenseDocument, string>({
  query: (documentId) => `/expense-documents/${documentId}`,
  providesTags: (result, error, documentId) => [
    { type: "ExpenseDocuments", id: documentId },
  ],
}),

extractExpenseDocument: build.mutation<ExtractExpenseDocumentResponse,string>({
  query: (documentId) => ({
    url: `/expense-documents/${documentId}/extract`,
    method: "POST",
  }),
  invalidatesTags: (result, error, documentId) => [
    { type: "ExpenseDocuments", id: documentId },
    { type: "ExpenseDocuments", id: "LIST" },
  ],
}),

saveExpenseFromDocument: build.mutation<
  SaveExpenseFromDocumentResponse,
  {
    documentId: string;
    body: SaveExpenseFromDocumentBody;
  }
>({
  query: ({ documentId, body }) => ({
    url: `/expense-documents/${documentId}/save-expense`,
    method: "POST",
    body,
  }),
  invalidatesTags: (result, error, arg) => [
    { type: "ExpenseDocuments", id: arg.documentId },
    { type: "ExpenseDocuments", id: "LIST" },
    { type: "Expenses", id: "LIST" },
  ],
}),
createExpenseDocument: build.mutation<CreateExpenseDocumentResponse, CreateExpenseDocumentBody>({
  query: (body) => ({
    url: "/expense-documents",
    method: "POST",
    body,
  }),
  invalidatesTags: [
    { type: "ExpenseDocuments", id: "LIST" },
  ],
}),
getChequeDraftExpenseGroups: build.query<
  ChequeDraftExpenseGroup[],
  { from?: string; end?: string } | void
>({
  query: (params) => ({
    url: "/cheque-drafts/expense-groups",
    params: params ?? {},
  }),
  providesTags: [
    { type: "ChequeDrafts", id: "EXPENSE_GROUPS" },
    { type: "Expenses", id: "LIST" },
  ],
}),

getChequeDrafts: build.query<ChequeDraft[], void>({
  query: () => "/cheque-drafts",
  providesTags: [{ type: "ChequeDrafts", id: "LIST" }],
}),

getChequeDraftById: build.query<ChequeDraft, string>({
  query: (chequeDraftId) => `/cheque-drafts/${chequeDraftId}`,
  providesTags: (result, error, chequeDraftId) => [
    { type: "ChequeDrafts", id: chequeDraftId },
  ],
}),

createChequeDraft: build.mutation<CreateChequeDraftResponse, CreateChequeDraftBody>({
  query: (body) => ({
    url: "/cheque-drafts",
    method: "POST",
    body,
  }),
  invalidatesTags: [
    { type: "ChequeDrafts", id: "LIST" },
    { type: "ChequeDrafts", id: "EXPENSE_GROUPS" },
    { type: "Expenses", id: "LIST" },
  ],
}),

voidChequeDraft: build.mutation<VoidChequeDraftResponse, string>({
  query: (chequeDraftId) => ({
    url: `/cheque-drafts/${chequeDraftId}/void`,
    method: "PATCH",
  }),
  invalidatesTags: (result, error, chequeDraftId) => [
    { type: "ChequeDrafts", id: chequeDraftId },
    { type: "ChequeDrafts", id: "LIST" },
    { type: "ChequeDrafts", id: "EXPENSE_GROUPS" },
    { type: "Expenses", id: "LIST" },
  ],
}),
  }),
});

// ----------------------
// Hooks
// ----------------------

export const {
  useGetDashboardMetricsQuery,
  useGetSalesOverviewQuery,
  useGetDashboardPurchaseSummaryQuery,
  useGetDashboardProcurementOverviewQuery,
    
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
  useReviewUserAccessMutation,
  useNotifyPendingAccessMutation,

  useAdjustInventoryMutation,
  useSetInventoryMutation,
  useGetInventoryQuery,
  useGetInventoryWithoutExpiryDateQuery,
  useUpdateInventoryMetaMutation,

  useGetExpensesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseStatusMutation,
  useGetExpenseByIdQuery,

 useGetSuppliersQuery,
 useGetSuppliersAnalyticsQuery,

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
  useGetPaymentHistoryQuery,

  useCreateMatchMutation,
  useGetMatchByIdQuery,
  //MightDelete the line below 
  useUpdateMatchStatusMutation,

  useGetQuarterlyReportQuery,
  useGenerateAIQuaterlyReportMutation,

  useGetQuickBooksSummaryQuery,
  useGetQuickBooksCustomersQuery,
  useGetQuickBooksCustomerByIdQuery,
  useGetQuickBooksInvoicesQuery,
  useGetQuickBooksInvoiceByIdQuery,

  useGetQuickBooksPaymentsQuery,
  useGetQuickBooksChequesQuery,

  useForceQuickBooksInvoiceBackfillMutation,

   useGetOrganizationsQuery,
  useGetAvailableOrganizationCustomersQuery,
  useCreateOrganizationMutation,
  useGetOrganizationByIdQuery,
  useAssignUserToOrganizationMutation,

  useGetClientDashboardQuery,
  useGetClientInvoicesQuery,
  useGetClientInvoiceByIdQuery,

   useCreateOrganizationInviteMutation,
  useGetOrganizationInvitesQuery,
  useAcceptInviteMutation,

  useGetExpenseDocumentByIdQuery,
  useExtractExpenseDocumentMutation,
  useSaveExpenseFromDocumentMutation,
   useCreateExpenseDocumentMutation,

   useCreateChequeDraftMutation,
   useGetChequeDraftExpenseGroupsQuery,
} = api;



