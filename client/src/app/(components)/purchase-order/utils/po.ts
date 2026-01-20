//A type where the value will be the product id and the label will be the name of product
export type ComboOption = { value: string; label: string };

/**
 * Generates a unique purchase order number in the format PO-YYYY-MM-DD-XXXX
 * where YYYY is the year, MM is the month, DD is the day, and XXXX is a random 4-digit number
 * @returns {string} a unique purchase order number
 */
export function genPONumber() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PO-${d.getFullYear()}-${pad(d.getMonth() + 1)}${pad(d.getDate())}-${rand}`;
}

export function safeNumber(n: unknown) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

export function todayYMD() {
  //return new Date().toISOString().slice(0, 10);
  return new Date()
}
