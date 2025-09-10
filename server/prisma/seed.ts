import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const DATA_DIR = path.join(__dirname, "seedData");

/* ------------------------- small helpers ------------------------- */

function readJson<T = any>(fileName: string): T[] {
  const fp = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(fp)) return [];
  const raw = fs.readFileSync(fp, "utf-8");
  return JSON.parse(raw);
}

/** Try to resolve a Prisma delegate from a file name.
 *  1) prefers lowerCamel (e.g., "products" -> prisma.products)
 *  2) falls back to PascalCase key (rare, but keeps your old template happy)
 */
function getDelegate(fileName: string): any | undefined {
  const base = path.basename(fileName, path.extname(fileName)); // e.g. "products"
  const lower = base; // prisma.<model> is typically lowerCamel equal to your model name
  const pascal = base.charAt(0).toUpperCase() + base.slice(1); // your older template

  // try lower first, then pascal (keeps your older code path working if you had that shape)
  return (prisma as any)[lower] ?? (prisma as any)[pascal];
}

/** number|string → BigInt (for ExpenseByCategory.amount, etc.) */
function toBigInt(v: any): bigint | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "bigint") return v;
  if (typeof v === "number") return BigInt(Math.trunc(v));
  if (typeof v === "string") return BigInt(v.trim());
  throw new Error(`Cannot convert ${v} to BigInt`);
}

/** Per-file row transformations (to match your schema types) */
function mapRow(fileName: string, r: any): any {
  switch (fileName) {
    // Catalogs
    case "products.json":
      return {
        ...r,
        sku: r.sku?.trim?.(), // keep required/unique non-empty
        // createdAt/updatedAt left to defaults if your schema has them
      };

    // Purchase Orders (header)
    case "purchaseOrder.json":
      return {
        ...r,
        subtotal: r.subtotal?.toString?.(),
        tax: r.tax?.toString?.(),
        total: r.total?.toString?.(),
      };

    // Purchase Order Items (lines)
    case "purchaseOrderItem.json":
      return {
        ...r,
        unitPrice: r.unitPrice?.toString?.(),
        lineTotal: r.lineTotal?.toString?.(),
      };

    // Goods Receipts (header)
    case "goodsReceipt.json":
      return r;

    // Goods Receipt Items
    case "goodsReceiptItem.json":
      return {
        ...r,
        unitPrice: r.unitPrice?.toString?.(),
      };

    // Supplier Invoices (header)
    case "supplierInvoice.json":
      return {
        ...r,
        amount: r.amount?.toString?.(),
      };

    // Supplier Invoice Items
    case "supplierInvoiceItem.json":
      return {
        ...r,
        unitPrice: r.unitPrice?.toString?.(),
        lineTotal: r.lineTotal?.toString?.(),
      };

    // Stock Ledger (movements)
    case "stockLedger.json":
      return r;

    // Sales / Purchases / Summaries (if you store numerics as Decimal/BigInt strings)
    case "sales.json":
    case "salesSummary.json":
    case "purchases.json":
    case "purchaseSummary.json":
      return {
        ...r,
        // add coercions here if you have Decimal fields, e.g.:
        // total: r.total?.toString?.(),
      };

    // Expense Summary (top-level totals, if any need coercion)
    case "expenseSummary.json":
      return {
        ...r,
        // e.g., total: r.total?.toString?.(),
      };

    // Expense By Category (amount is BigInt in your earlier schema)
    case "expenseByCategory.json":
      return {
        ...r,
        amount: toBigInt(r.amount)!, // required BigInt
      };

    // Expenses (detail lines)
    case "expenses.json":
      return {
        ...r,
        // amount: r.amount?.toString?.(),
      };

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
] as const;

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
] as const;

/* ----------------------------- actions ----------------------------- */

async function deleteAllData(fileNames: readonly string[]) {
  for (const fileName of fileNames) {
    const delegate = getDelegate(fileName);
    if (!delegate?.deleteMany) {
      console.error(
        `⚠️  Could not resolve model for ${fileName}. Skipping delete.`
      );
      continue;
    }
    await delegate.deleteMany({});
    const base = path.basename(fileName, path.extname(fileName));
    console.log(`Cleared data from ${base}`);
  }
}

async function seedFiles(fileNames: readonly string[]) {
  for (const fileName of fileNames) {
    const rows = readJson(fileName);
    if (!rows.length) {
      console.log(`(skip) no data: ${fileName}`);
      continue;
    }

    const delegate = getDelegate(fileName);
    if (!delegate?.create) {
      console.error(
        `❌ No Prisma model matches the file name: ${fileName} (delegate not found)`
      );
      continue;
    }

    for (const raw of rows) {
      const data = mapRow(fileName, raw);
      await delegate.create({ data });
    }

    const base = path.basename(fileName, path.extname(fileName));
    console.log(`Seeded ${base} with data from ${fileName} (${rows.length})`);
  }
}

/* ----------------------------- main ----------------------------- */

async function main() {
  // 1) Wipe in FK-safe order
  await deleteAllData(DELETE_FILES);

  // 2) Insert in FK-safe order with per-file coercions
  await seedFiles(INSERT_FILES);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("✅ Seed complete");
  });














{/*

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

  */}