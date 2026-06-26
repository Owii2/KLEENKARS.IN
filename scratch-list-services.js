const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const services = await prisma.service.findMany({ select: { id: true, name: true, price: true, description: true, isActive: true } });
  console.log("SERVICES IN DB:");
  console.log(JSON.stringify(services, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
