import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signToken, COOKIE_MAX_AGE } from '@/lib/jwt';
import { createRefreshToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, password } = body; // identifier = email or phone
    if (!identifier || !password) return NextResponse.json({ success: false, message: 'identifier and password required' }, { status: 400 });

    const customer = await prisma.customer.findFirst({ where: { OR: [{ email: identifier }, { phoneNumber: identifier }] } });
    if (!customer || !customer.password) return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });

    const ok = await bcrypt.compare(password, customer.password);
    if (!ok) return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });

    // create JWT and set as HttpOnly cookie
    const token = signToken({ id: customer.id, role: 'customer' });
    const { raw: refreshRaw } = await createRefreshToken(customer.id);
    const maxAge = COOKIE_MAX_AGE;
    const refreshMax = 60 * 60 * 24 * 30; // 30 days
    const secureAttr = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
    const cookie = `token=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax; ${secureAttr}`;
    const refreshCookie = `refreshToken=${refreshRaw}; HttpOnly; Path=/; Max-Age=${refreshMax}; SameSite=Lax; ${secureAttr}`;

    const safe = { id: customer.id, customerName: customer.customerName, phone: customer.phoneNumber, email: customer.email };
    const response = new NextResponse(JSON.stringify({ success: true, customer: safe }), {
      status: 200,
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
