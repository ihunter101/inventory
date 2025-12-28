import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type StockRequestStatus =
  | "SUBMITTED"
  | "FULFILLED"
  | "CANCELLED"
  | "IN_REVIEW";

export type StockRequestListItem = {
  id: string;
  status: StockRequestStatus;
  submittedAt: string; // ISO string from API
  requestedByName: string;
  requestedByEmail: string;
  requestedByLocation: Location;
  lineCount: number;
};

export type Paginated<TItem> = {
  items: TItem[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type StockRequestListResponse = Paginated<StockRequestListItem>;

export type StockRequestListQuery = {
  page: number;
  pageSize?: number;
  status?: StockRequestStatus;
  location?: Location
  search?: string;
};

export type Location = "Tapion" | "Blue Coral" | "Manoel Street" | "Sunny Acres" | "Em-Care" | "Rodney Bay" | "M-Care" | "Vieux-Fort" | "Sourfriere" | "other"

//-------------
export type StockLineOutcome = "PENDING" | "GRANTED" | "ADJUSTED" | "UNAVAILABLE";

export type StockRequestLineDetail = {
  id: string;
  productId: string;
  productName: string;
  unit?: string | null;
  department?: string | null;
  availableQty: number | null;
  requestedQty: number;
  grantedQty: number | null;
  outcome: StockLineOutcome;
  notes?: string | null;
};

export type StockRequestDetailResponse = {
  id: string;
  status: StockRequestStatus;
  submittedAt: string;
  requestedByName: string;
  requestedByEmail: string;
  requestedByLocation: Location;
  expectedDeliveryAt: string | null;
  messageToRequester: string | null;
  lines: StockRequestLineDetail[];
};
//____________
export type StockSheetLine = {
    productId: string;
    name: string;
    unit?: string | null;
    category?: string | null;
    department?: string | null;
    imageUrl?: string | null;
    requestedQty: number
}

//------------------------


export type FulfillStockRequestResponse = { ok: boolean; status: StockRequestStatus };

export type ReviewStockRequestBody = {
   id: string;
  body: {
    messageToRequester?: string | null;
    expectedDeliveryAt?: string | null;
    lines: Array<{
      lineId: string;
      grantedQty: number;
      notes?: string | null;
    }>;
  };
};


export type StockSheetState = {
    lines: StockSheetLine[];
}

const initialState: StockSheetState = {
    lines: []
}

function clamQty(qauntity: number) {
    if(!Number.isFinite(qauntity)) return 1;
    return Math.max(1, Math.floor(qauntity))
}

const stockSheetSlice = createSlice({
    name: "StockSheet",
    initialState,
    reducers: {
        addLine: (state, action: PayloadAction<Omit<StockSheetLine, "requestedQty"> & {requestedQty?: number}>) => {
            const {productId} = action.payload;

            const existing = state.lines.find((l) => l.productId === productId);

            if (existing) {
                existing.requestedQty = clamQty(existing.requestedQty + (action.payload.requestedQty ?? 1))
                return;
            }

            state.lines.push({
                productId,
                name: action.payload.name,
                unit: action.payload.unit ?? null,
                category: action.payload.category ?? null,
                department: action.payload.department ?? null,
                imageUrl: action.payload.imageUrl ?? null,
                requestedQty: clamQty(action.payload.requestedQty ?? 1),
            })
        },

        removeLine: (state, action: PayloadAction<{productId: string}>) => {
            state.lines = state.lines.filter((line) => line.productId !== action.payload.productId)
        },

        setQuantity: (state, action: PayloadAction<{productId: string, requestedQty: number}>) => {
            const line = state.lines.find((line) => line.productId === action.payload.productId)
            if (!line) return
            line.requestedQty = clamQty(action.payload.requestedQty)
        },

        increment: (state, action: PayloadAction<{productId: string}>) => {
            const line = state.lines.find((line) => line.productId === action.payload.productId);
            if (!line) return;

            line.requestedQty = clamQty(line.requestedQty + 1);
        },

        decrement: (state, action: PayloadAction<{productId: string}>) => {
            const line = state.lines.find((line) => line.productId === action.payload.productId)
            if (!line) return;

            line.requestedQty = clamQty(line.requestedQty -1);
        },
        
        clear: (state) => {
            state.lines = [];
        },

        hydrate: (_state, action: PayloadAction<StockSheetState>) => {
            return action.payload;
        },
    },
});

export const {
    addLine,
    removeLine,
    setQuantity,
    increment,
    decrement,
    clear,
    hydrate
} = stockSheetSlice.actions

export const stockSheetReducer = stockSheetSlice.reducer;

//Selectors

export const selectStockSheetLines = (state: any) => state.stockSheet.lines as StockSheetLine[];
export const selectStockSheetCount = (state: any) => (state.stockSheet.lines as StockSheetLine[]).length
export const selectSheetTotalQuantity = (state: any) => (
    state.stockSheet.lines as StockSheetLine[]).reduce((sum, line) => sum + line.requestedQty, 0)
export const selectLineByProductId = (productId: string) => (state:any) => (
    state.stockSheet.lines as StockSheetLine[]).find((line) => line.productId === productId)

