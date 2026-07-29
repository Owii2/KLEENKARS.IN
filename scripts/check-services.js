const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const services = await prisma.service.findMany({
    orderBy: { createdAt: 'desc' }
  });
  console.log("Services in Database:", JSON.stringify(services, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
