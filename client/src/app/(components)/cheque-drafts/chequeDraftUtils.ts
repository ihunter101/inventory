export type DateRange = {
  from: string;
  end: string;
};

export function getCurrentMonthRange(): DateRange {
  const now = new Date();

  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = now;

  return {
    from: from.toISOString(),
    end: end.toISOString(),
  };
}

export function getCurrentMonthLabel() {
  const now = new Date();

  return now.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function formatCurrency(amount: number, currency = "XCD") {
  return `${currency} ${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(date?: string | null) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}