import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, points } = body;
    if (!phone || !points) return NextResponse.json({ success: false, message: 'phone and points required' }, { status: 400 });

    const customer = await prisma.customer.findUnique({ where: { phoneNumber: phone } });
    if (!customer) return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });

    if ((customer.referralPoints || 0) < points) return NextResponse.json({ success: false, message: 'Insufficient points' }, { status: 400 });

    await prisma.customer.update({ where: { id: customer.id }, data: { referralPoints: { decrement: points } } });
    await prisma.referralRedemption.create({ data: { customerId: customer.id, points } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
