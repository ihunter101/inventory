import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Deleting QuickBooks synced data...");

  await prisma.customerInvoiceLine.deleteMany({});
  console.log("Deleted customer invoice lines");

  await prisma.customerPayment.deleteMany({});
  console.log("Deleted customer payments");

  await prisma.chequePayment.deleteMany({});
  console.log("Deleted cheque payments");

  await prisma.customerInvoice.deleteMany({});
  console.log("Deleted customer invoices");

  await prisma.customer.deleteMany({});
  console.log("Deleted customers");

  await prisma.quickBooksSyncState.deleteMany({});
  console.log("Deleted QuickBooks sync state");

  console.log("QuickBooks sync reset complete.");
}

main()
  .catch((error) => {
    console.error("Reset failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });