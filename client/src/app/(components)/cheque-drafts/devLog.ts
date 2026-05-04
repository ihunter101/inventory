export function devLog(label: string, data?: unknown) {
  if (process.env.NODE_ENV !== "development") return;

  console.debug(`[ChequeDrafts] ${label}`, data ?? "");
}

export function devError(label: string, error?: unknown) {
  if (process.env.NODE_ENV !== "development") return;

  console.error(`[ChequeDrafts] ${label}`, error ?? "");
}