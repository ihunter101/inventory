// src/app/lib/date.ts
export function toYMD(d: string | Date | undefined | null): string {
  if (!d) return "-";
  const dt = typeof d === "string" ? new Date(d) : d;
  // guards for invalid dates
  if (!dt || Number.isNaN(dt.getTime())) return "-";
  return dt.toISOString().slice(0, 10);
}
