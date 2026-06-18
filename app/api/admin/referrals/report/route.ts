import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireRoles } from '@/lib/apiAuth';

export async function GET() {
  const auth = await requireRoles(['admin','manager','supervisor']);
  if (auth.response) return auth.response;
  try {
    const customers = await prisma.customer.findMany({ orderBy: { referralPoints: 'desc' } });
    const report = await Promise.all(customers.map(async c => ({
      customer: c,
      redemptions: await prisma.referralRedemption.count({ where: { customerId: c.id } })
    })));
    return NextResponse.json({ success: true, report });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
