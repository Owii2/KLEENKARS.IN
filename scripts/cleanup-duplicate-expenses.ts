import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Fetch all expenses ordered by newest first (assuming `createdAt` exists)
  const expenses = await prisma.expense.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Map to keep the first (newest) expense for each normalized key
  const seen = new Map<string, string>(); // key -> expense id
  const duplicates: string[] = [];

  for (const exp of expenses) {
    // Normalize date to calendar day (YYYY-MM-DD)
    const date = new Date(exp.date);
    const day = date.toISOString().split('T')[0];
    const normCategory = (exp.category || '').trim().toLowerCase();
    const normPaidTo = (exp.paidTo || '').trim().toLowerCase();
    const key = `${day}||${exp.amount}||${normCategory}||${normPaidTo}`;

    if (seen.has(key)) {
      // Already seen this combination – mark for deletion
      duplicates.push(exp.id as unknown as string);
    } else {
      seen.set(key, exp.id as unknown as string);
    }
  }

  if (duplicates.length > 0) {
    await prisma.expense.deleteMany({
      where: { id: { in: duplicates } },
    });
    console.log(`Deleted ${duplicates.length} duplicate expense record(s).`);
  } else {
    console.log('No duplicate expenses found.');
  }
}

main()
  .catch((e) => {
    console.error('Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
