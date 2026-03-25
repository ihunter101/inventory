import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("--- START OF DATA ---");
  
  // We only pull what currently exists in your DB
  const inventory = await prisma.inventory.findMany({
    select: {
      id: true,
      productId: true,
      stockQuantity: true,
    }
  });

  // This will group them so we can see which products have multiple rows
  const report = inventory.reduce((acc: any, item) => {
    if (!acc[item.productId]) {
      acc[item.productId] = [];
    }
    acc[item.productId].push(item);
    return acc;
  }, {});

  console.log(JSON.stringify(report, null, 2));
  console.log("--- END OF DATA ---");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });