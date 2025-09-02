"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatus = void 0;
const resolveReorderPoint = (minQuantity, reorderPoint) => {
    const minQ = Number(minQuantity !== null && minQuantity !== void 0 ? minQuantity : 0);
    return typeof reorderPoint === "number" ? reorderPoint : minQ * 2;
};
const getStatus = (stockQuantity, minQuantity, reorderPoint) => {
    const q = Number(stockQuantity !== null && stockQuantity !== void 0 ? stockQuantity : 0);
    const minQ = Number(minQuantity !== null && minQuantity !== void 0 ? minQuantity : 0);
    const reorder = resolveReorderPoint(minQ, reorderPoint);
    if (q <= minQ)
        return "critical";
    if (q <= reorder)
        return "low-stock";
    return "in-stock";
};
exports.getStatus = getStatus;
