export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-LC", {
    style: "currency",
    currency: "XCD",
  }).format(value);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-LC", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

/** Returns how many days until/since a date. Negative = overdue. */
export function daysFromNow(value: string | Date | null | undefined): number | null {
  if (!value) return null;
  const diff = new Date(value).getTime() - Date.now();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}