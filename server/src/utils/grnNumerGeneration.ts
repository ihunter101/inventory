export function yyyymmdd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`; // "20260126"
}

export function pad4(n: number) {
  return String(n).padStart(4, "0"); // 1 -> "0001"
}
