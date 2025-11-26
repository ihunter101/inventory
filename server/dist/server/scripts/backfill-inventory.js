"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/scripts/backfill-inventory.cjs
const prisma_1 = require("../src/lib/prisma");
//const prisma = new PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const products = yield prisma_1.prisma.products.findMany({
            select: {
                productId: true,
                stockQuantity: true,
                minQuantity: true,
                reorderPoint: true,
            },
        });
        for (const p of products) {
            yield prisma_1.prisma.inventory.upsert({
                where: { productId: p.productId },
                create: {
                    productId: p.productId,
                    stockQuantity: (_a = p.stockQuantity) !== null && _a !== void 0 ? _a : 0,
                    minQuantity: (_b = p.minQuantity) !== null && _b !== void 0 ? _b : 0,
                    reorderPoint: (_c = p.reorderPoint) !== null && _c !== void 0 ? _c : 0,
                },
                update: {},
            });
        }
        console.log(`Backfilled inventory for ${products.length} products.`);
    });
}
main()
    .catch((e) => {
    console.error("Backfill failed:", e);
    process.exitCode = 1;
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.prisma.$disconnect();
}));
