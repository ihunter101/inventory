import type { LineRow } from "./types";

export const money = (n: unknown) => {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
};

export function genInvoiceNumber() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const rand = Math.floor(100 + Math.random() * 900);
  return `SI-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${rand}`;
}

export function rowId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `row_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function makeEmptyRow(): LineRow {
  return {
    id: rowId(),
    productId: undefined,
    name: "",
    unit: "",
    quantity: 1,
    unitPrice: 0,
  };
}
