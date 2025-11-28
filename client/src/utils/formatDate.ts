export function formatDate(dateString?: string | null) {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "-";
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}
