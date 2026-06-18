import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

interface CustomerTokenPayload {
  id?: string;
}

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const match = cookie.match(/token=([^;]+)/);
    if (!match) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    const token = match[1];
    const payload = verifyToken(token) as CustomerTokenPayload | null;
    if (!payload || !payload.id) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });

    const customer = await prisma.customer.findUnique({ where: { id: payload.id } });
    if (!customer) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    const safe = { id: customer.id, customerName: customer.customerName, phone: customer.phoneNumber, email: customer.email };
    return NextResponse.json({ success: true, customer: safe });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
