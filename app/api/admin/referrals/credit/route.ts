import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireRoles } from '@/lib/apiAuth';

export async function POST(req: Request) {
  const auth = await requireRoles(['admin','manager','supervisor']);
  if (auth.response) return auth.response;
  try {
    const body = await req.json();
    const { phone, points } = body;
    if (!phone || typeof points !== 'number') return NextResponse.json({ success: false, message: 'phone and points required' }, { status: 400 });
    const cust = await prisma.customer.findUnique({ where: { phoneNumber: phone } });
    if (!cust) return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    await prisma.customer.update({ where: { id: cust.id }, data: { referralPoints: { increment: points } } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
