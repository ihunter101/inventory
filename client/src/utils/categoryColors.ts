export const CATEGORY_COLORS = [
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // purple
  "#06B6D4", // cyan
  "#84CC16", // lime
  "#F97316", // orange
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0; // simple hash
  }
  return Math.abs(hash);
}

export function getCategoryColor(name: string): string {
  if (!name) return CATEGORY_COLORS[0];
  const idx = hashString(name.toLowerCase()) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[idx];
}