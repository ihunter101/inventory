// server/scripts/backfill-inventory.cjs
import { prisma } from "../src/lib/prisma";

//const prisma = new PrismaClient();

async function main() {
  const products = await prisma.products.findMany({
    select: {
      productId: true,
      stockQuantity: true,
      minQuantity: true,
      reorderPoint: true,
    },
  });

  for (const p of products) {
    await prisma.inventory.upsert({
      where: { productId: p.productId },
      create: {
        productId: p.productId,
        stockQuantity: p.stockQuantity ?? 0,
        minQuantity: p.minQuantity ?? 0,
        reorderPoint: p.reorderPoint ?? 0,
      },
      update: {},
    });
  }

  console.log(`Backfilled inventory for ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
