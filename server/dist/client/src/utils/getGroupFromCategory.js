"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGroupFromCategory = getGroupFromCategory;
// utils/getGroupFromCategory.ts
function getGroupFromCategory(category) {
    const c = category.toLowerCase();
    if (["ppe", "phlebotomy", "reagents", "microbiology", "chemistry"].includes(c)) {
        return "Clinical";
    }
    if (["equipment", "analyzer", "machinery", "rent", "maintenance"].includes(c)) {
        return "Equipment & Infrastructure";
    }
    if (["utilities", "utility", "water", "light", "electricity", "internet", "transport", "logistics"].includes(c)) {
        return "Logistics & Overhead";
    }
    return "Other";
}
