export type Status = "in-stock" | "critical" | "low-stock"

const resolveReorderPoint = (minQuantity?: number | null, reorderPoint?: number | null) => {
    const minQ = Number(minQuantity ?? 0)
    return typeof reorderPoint === "number" ? reorderPoint : minQ * 2
}

export const getStatus = (stockQuantity: number, minQuantity?: number | null, reorderPoint?: number | null) => {
    const q = Number(stockQuantity ?? 0);
    const minQ = Number(minQuantity ?? 0);
    const reorder = resolveReorderPoint(minQ, reorderPoint);

    if (q <= minQ) return "critical";
    if (q <= reorder) return "low-stock"
    return "in-stock"
}
