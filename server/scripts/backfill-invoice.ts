import { prisma } from "../src/lib/prisma";


async function backfill() {
  console.log("Starting deep backfill of Invoice Item product links...");

  // 1. Find all Goods Receipt Items that have a real product linked
  const grnItems = await prisma.goodsReceiptItem.findMany({
    where: {
      productId: { not: null },
      poItemId: { not: null },
    },
    select: {
      productId: true,
      poItemId: true,
    },
  });

  console.log(`Found ${grnItems.length} promoted items in Goods Receipts.`);

  let updatedCount = 0;

  // 2. Map those product IDs back to Invoice Items via the poItemId
  for (const grnItem of grnItems) {
    const updateResult = await prisma.supplierInvoiceItem.updateMany({
      where: {
        poItemId: grnItem.poItemId,
        productId: null, // Only fill if it's currently empty
      },
      data: {
        productId: grnItem.productId,
      },
    });
    updatedCount += updateResult.count;
  }

  console.log(`Backfill complete. Updated ${updatedCount} invoice items across all invoices.`);
}

backfill()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
