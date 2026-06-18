import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signToken, COOKIE_MAX_AGE } from '@/lib/jwt';
import { createRefreshToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, phoneNumber, customerName, password } = body;
    if (!phoneNumber || !password || !customerName) return NextResponse.json({ success: false, message: 'name, phone and password required' }, { status: 400 });

    // check existing by phone or email
    const existing = await prisma.customer.findFirst({ where: { OR: [{ phoneNumber }, { email }] } });
    if (existing) return NextResponse.json({ success: false, message: 'User already exists' }, { status: 400 });

    const hashed = await bcrypt.hash(password, 10);

    const customer = await prisma.customer.create({ data: { customerName, phoneNumber, email, password: hashed } });

    const token = signToken({ id: customer.id, role: 'customer' });
    const { raw: refreshRaw } = await createRefreshToken(customer.id);
    const maxAge = COOKIE_MAX_AGE;
    const refreshMax = 60 * 60 * 24 * 30; // 30 days
    const secureAttr = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
    const cookie = `token=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax; ${secureAttr}`;
    const refreshCookie = `refreshToken=${refreshRaw}; HttpOnly; Path=/; Max-Age=${refreshMax}; SameSite=Lax; ${secureAttr}`;

    const safe = { id: customer.id, customerName: customer.customerName, phone: customer.phoneNumber, email: customer.email };
    const response = new NextResponse(JSON.stringify({ success: true, customer: safe }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    response.headers.append('Set-Cookie', cookie);
    response.headers.append('Set-Cookie', refreshCookie);

    return response;
  } catch (err) {
    console.log(err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
