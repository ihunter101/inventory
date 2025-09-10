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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
const DATA_DIR = path_1.default.join(__dirname, "seedData");
/* ------------------------- small helpers ------------------------- */
function readJson(fileName) {
    const fp = path_1.default.join(DATA_DIR, fileName);
    if (!fs_1.default.existsSync(fp))
        return [];
    const raw = fs_1.default.readFileSync(fp, "utf-8");
    return JSON.parse(raw);
}
/** Try to resolve a Prisma delegate from a file name.
 *  1) prefers lowerCamel (e.g., "products" -> prisma.products)
 *  2) falls back to PascalCase key (rare, but keeps your old template happy)
 */
function getDelegate(fileName) {
    var _a;
    const base = path_1.default.basename(fileName, path_1.default.extname(fileName)); // e.g. "products"
    const lower = base; // prisma.<model> is typically lowerCamel equal to your model name
    const pascal = base.charAt(0).toUpperCase() + base.slice(1); // your older template
    // try lower first, then pascal (keeps your older code path working if you had that shape)
    return (_a = prisma[lower]) !== null && _a !== void 0 ? _a : prisma[pascal];
}
/** number|string → BigInt (for ExpenseByCategory.amount, etc.) */
function toBigInt(v) {
    if (v === null || v === undefined)
        return null;
    if (typeof v === "bigint")
        return v;
    if (typeof v === "number")
        return BigInt(Math.trunc(v));
    if (typeof v === "string")
        return BigInt(v.trim());
    throw new Error(`Cannot convert ${v} to BigInt`);
}
/** Per-file row transformations (to match your schema types) */
function mapRow(fileName, r) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
    switch (fileName) {
        // Catalogs
        case "products.json":
            return Object.assign(Object.assign({}, r), { sku: (_b = (_a = r.sku) === null || _a === void 0 ? void 0 : _a.trim) === null || _b === void 0 ? void 0 : _b.call(_a) });
        // Purchase Orders (header)
        case "purchaseOrder.json":
            return Object.assign(Object.assign({}, r), { subtotal: (_d = (_c = r.subtotal) === null || _c === void 0 ? void 0 : _c.toString) === null || _d === void 0 ? void 0 : _d.call(_c), tax: (_f = (_e = r.tax) === null || _e === void 0 ? void 0 : _e.toString) === null || _f === void 0 ? void 0 : _f.call(_e), total: (_h = (_g = r.total) === null || _g === void 0 ? void 0 : _g.toString) === null || _h === void 0 ? void 0 : _h.call(_g) });
        // Purchase Order Items (lines)
        case "purchaseOrderItem.json":
            return Object.assign(Object.assign({}, r), { unitPrice: (_k = (_j = r.unitPrice) === null || _j === void 0 ? void 0 : _j.toString) === null || _k === void 0 ? void 0 : _k.call(_j), lineTotal: (_m = (_l = r.lineTotal) === null || _l === void 0 ? void 0 : _l.toString) === null || _m === void 0 ? void 0 : _m.call(_l) });
        // Goods Receipts (header)
        case "goodsReceipt.json":
            return r;
        // Goods Receipt Items
        case "goodsReceiptItem.json":
            return Object.assign(Object.assign({}, r), { unitPrice: (_p = (_o = r.unitPrice) === null || _o === void 0 ? void 0 : _o.toString) === null || _p === void 0 ? void 0 : _p.call(_o) });
        // Supplier Invoices (header)
        case "supplierInvoice.json":
            return Object.assign(Object.assign({}, r), { amount: (_r = (_q = r.amount) === null || _q === void 0 ? void 0 : _q.toString) === null || _r === void 0 ? void 0 : _r.call(_q) });
        // Supplier Invoice Items
        case "supplierInvoiceItem.json":
            return Object.assign(Object.assign({}, r), { unitPrice: (_t = (_s = r.unitPrice) === null || _s === void 0 ? void 0 : _s.toString) === null || _t === void 0 ? void 0 : _t.call(_s), lineTotal: (_v = (_u = r.lineTotal) === null || _u === void 0 ? void 0 : _u.toString) === null || _v === void 0 ? void 0 : _v.call(_u) });
        // Stock Ledger (movements)
        case "stockLedger.json":
            return r;
        // Sales / Purchases / Summaries (if you store numerics as Decimal/BigInt strings)
        case "sales.json":
        case "salesSummary.json":
        case "purchases.json":
        case "purchaseSummary.json":
            return Object.assign({}, r);
        // Expense Summary (top-level totals, if any need coercion)
        case "expenseSummary.json":
            return Object.assign({}, r);
        // Expense By Category (amount is BigInt in your earlier schema)
        case "expenseByCategory.json":
            return Object.assign(Object.assign({}, r), { amount: toBigInt(r.amount) });
        // Expenses (detail lines)
        case "expenses.json":
            return Object.assign({}, r);
        // Users / Suppliers usually need no coercion
        case "users.json":
        case "supplier.json":
            return r;
        default:
            return r;
    }
}
/* ------------------------- file orders ------------------------- */
/** Delete children first (FK-safe). These are file *names*. */
const DELETE_FILES = [
    // doc lines first, then headers
    "stockLedger.json",
    "goodsReceiptItem.json",
    "goodsReceipt.json",
    "supplierInvoiceItem.json",
    "supplierInvoice.json",
    "purchaseOrderItem.json",
    "purchaseOrder.json",
    // flows
    "purchases.json",
    "sales.json",
    // summaries (depend on flows)
    "expenseByCategory.json",
    "expenseSummary.json",
    "salesSummary.json",
    "purchaseSummary.json",
    "expenses.json",
    // catalogs / roots
    "products.json",
    "supplier.json",
    "users.json",
];
/** Insert parents first (FK-safe). */
const INSERT_FILES = [
    // independent
    "users.json",
    // catalogs
    "supplier.json",
    "products.json",
    // purchasing (header → lines)
    "purchaseOrder.json",
    "purchaseOrderItem.json",
    // receipts
    "goodsReceipt.json",
    "goodsReceiptItem.json",
    // invoices
    "supplierInvoice.json",
    "supplierInvoiceItem.json",
    // movements
    "stockLedger.json",
    // flows & summaries
    "sales.json",
    "salesSummary.json",
    "purchases.json",
    "purchaseSummary.json",
    // expenses (summary before by-category if you have FK/validation coupling)
    "expenseSummary.json",
    "expenseByCategory.json",
    "expenses.json",
];
/* ----------------------------- actions ----------------------------- */
function deleteAllData(fileNames) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const fileName of fileNames) {
            const delegate = getDelegate(fileName);
            if (!(delegate === null || delegate === void 0 ? void 0 : delegate.deleteMany)) {
                console.error(`⚠️  Could not resolve model for ${fileName}. Skipping delete.`);
                continue;
            }
            yield delegate.deleteMany({});
            const base = path_1.default.basename(fileName, path_1.default.extname(fileName));
            console.log(`Cleared data from ${base}`);
        }
    });
}
function seedFiles(fileNames) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const fileName of fileNames) {
            const rows = readJson(fileName);
            if (!rows.length) {
                console.log(`(skip) no data: ${fileName}`);
                continue;
            }
            const delegate = getDelegate(fileName);
            if (!(delegate === null || delegate === void 0 ? void 0 : delegate.create)) {
                console.error(`❌ No Prisma model matches the file name: ${fileName} (delegate not found)`);
                continue;
            }
            for (const raw of rows) {
                const data = mapRow(fileName, raw);
                yield delegate.create({ data });
            }
            const base = path_1.default.basename(fileName, path_1.default.extname(fileName));
            console.log(`Seeded ${base} with data from ${fileName} (${rows.length})`);
        }
    });
}
/* ----------------------------- main ----------------------------- */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // 1) Wipe in FK-safe order
        yield deleteAllData(DELETE_FILES);
        // 2) Insert in FK-safe order with per-file coercions
        yield seedFiles(INSERT_FILES);
    });
}
main()
    .catch((e) => {
    console.error("❌ Seed failed:", e);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
    console.log("✅ Seed complete");
}));
{ /*

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
const prisma = new PrismaClient();

async function deleteAllData(orderedFileNames: string[]) {
  const modelNames = orderedFileNames.map((fileName) => {
    const modelName = path.basename(fileName, path.extname(fileName));
    return modelName.charAt(0).toUpperCase() + modelName.slice(1);
  });

  for (const modelName of modelNames) {
    const model: any = prisma[modelName as keyof typeof prisma];
    if (model) {
      await model.deleteMany({});
      console.log(`Cleared data from ${modelName}`);
    } else {
      console.error(
        `Model ${modelName} not found. Please ensure the model name is correctly specified.`
      );
    }
  }
}

async function main() {
  const dataDirectory = path.join(__dirname, "seedData");

  const orderedFileNames = [
    "products.json",
    "expenseSummary.json",
    "sales.json",
    "salesSummary.json",
    "purchases.json",
    "purchaseSummary.json",
    "users.json",
    "expenses.json",
    "expenseByCategory.json",
  ];

  await deleteAllData(orderedFileNames);

  for (const fileName of orderedFileNames) {
    const filePath = path.join(dataDirectory, fileName);
    const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const modelName = path.basename(fileName, path.extname(fileName));
    const model: any = prisma[modelName as keyof typeof prisma];

    if (!model) {
      console.error(`No Prisma model matches the file name: ${fileName}`);
      continue;
    }

    for (const data of jsonData) {
      await model.create({
        data,
      });
    }

    console.log(`Seeded ${modelName} with data from ${fileName}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

  */
}
