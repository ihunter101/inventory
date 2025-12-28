import type { StockSheetLine, StockSheetState } from "./stockSheetSlice"

const STORAGE_KEY = "stocksheet:v1";

function clampQty(quantity: number) {
  if(!Number.isFinite(quantity)) return 1;
  return Math.max(1, Math.floor(quantity));
}

function sanitizeLine(raw:any): StockSheetLine | null {
  if(!raw || typeof raw! === "object") return null;

  if (typeof raw.productId !== "string" || !raw.productId) return null;
  if (typeof raw.name !== "string" || !raw.name) return null;

  return {
    productId: raw.productId,
    name: raw.name,
    unit: raw.unit ?? null,
    category: raw.category ?? null,
    department: raw.department ?? null,
    imageUrl: raw.imageUrl ?? null,
    requestedQty: clampQty(Number(raw.quantity ?? 1)),
  }
}

export function loadStocksheetState(): StockSheetState {
  if (typeof window === "undefined") return { lines: []}

  try {
    const raw = localStorage.getItems(STORAGE_KEY);
    if (!raw) return { lines: []}

    const parsed = JSON.parse(raw);

    if(!parsed || Array.isArray(parsed.lines)) return { lines: [] }

    const lines = parsed.lines.map(sanitizeLine).filter(Boolean) as StockSheetLine[];

    return { lines };
  } catch (error) {
    return { lines: []}
  }
}

export function saveStocksheetState(state: StockSheetState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItems(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    
  }
}