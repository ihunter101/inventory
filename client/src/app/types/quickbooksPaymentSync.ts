export type PaymentMethod =
  | "CASH"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "CHEQUE"
  | "BANK_TRANSFER"
  | "OTHER";

export type QBPaymentSyncStatus =
  | "PENDING"
  | "SENT"
  | "SUCCESS"
  | "FAILED";

export type CustomerInvoiceStatus =
  | "UNPAID"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "VOID";

export type QuickBooksPaymentSyncJob = {
  id: string;
  status: QBPaymentSyncStatus;

  localPaymentId: string | null;

  qbRequestId: string;
  qbCustomerListId: string;
  qbInvoiceTxnId: string;

  qbPaymentTxnId: string | null;
  qbPaymentEditSequence: string | null;

  responseJson: string | null;
  errorMessage: string | null;

  attempts: number;

  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;

  payment?: {
    paymentId: string;
    qbTxnId: string | null;
    qbEditSequence: string | null;

    customerId: string | null;
    customerInvoiceId: string | null;

    customerName: string;
    paymentDate: string;
    amount: string | number;

    method: PaymentMethod | null;
    referenceNumber: string | null;
    notes: string | null;

    source: "QUICKBOOKS" | "MANUAL" | "INTERNAL";
    rawJson: string | null;
    lastSyncedAt: string | null;

    createdAt: string;
    updatedAt: string;

    invoice?: {
      invoiceId: string;
      qbTxnId: string | null;
      customerId: string | null;
      customerName: string;
      invoiceNumber: string | null;
      invoiceDate: string | null;
      totalAmount: string | number;
      amountPaid: string | number;
      balanceRemaining: string | number;
      status: CustomerInvoiceStatus;

      customer?: {
        customerId: string;
        qbListId: string | null;
        name: string;
        companyName: string | null;
      } | null;
    } | null;
  } | null;
};

export type QueueInvoicePaymentRequest = {
  amount: number;
  paymentDate: string;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  memo?: string;
};

export type QueueInvoicePaymentResponse = {
  message: string;
  data: {
    payment: unknown;
    syncJob: QuickBooksPaymentSyncJob;
    invoice?: unknown;
  };
};

export type BatchMarkInvoicesPaidRequest = {
  startDate: string;
  endDate: string;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  referencePrefix?: string;
  memo?: string;
  dryRun?: boolean;

  customerId?: string;
  customerSearch?: string;
};

export type BatchMarkInvoicesPaidResultItem = {
  invoiceId: string;
  invoiceNumber: string | null;
  customerName: string;
  amount: number;
  status: "WOULD_QUEUE" | "QUEUED" | "SKIPPED" | "FAILED";
  reason?: string;
  paymentId?: string;
  syncJobId?: string;
};

export type BatchMarkInvoicesPaidResponse = {
  message: string;
  data: {
    found: number;
    queued: number;
    skipped: number;
    failed: number;
    dryRun: boolean;
    items: BatchMarkInvoicesPaidResultItem[];
  };
};

export type GetQuickBooksPaymentSyncJobsResponse = {
  jobs: QuickBooksPaymentSyncJob[];
};

export type RetryQuickBooksPaymentSyncJobResponse = {
  message: string;
  job: QuickBooksPaymentSyncJob;
};