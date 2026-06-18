import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signToken, COOKIE_MAX_AGE } from '@/lib/jwt';
import { createRefreshToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { phoneNumber, code } = await req.json();
    if (!phoneNumber || !code) return NextResponse.json({ success: false, message: 'phoneNumber and code required' }, { status: 400 });

    const customer = await prisma.customer.findUnique({ where: { phoneNumber } });
    if (!customer || !customer.otpHash || !customer.otpExpires) return NextResponse.json({ success: false, message: 'No OTP requested' }, { status: 400 });

    if (new Date() > new Date(customer.otpExpires)) return NextResponse.json({ success: false, message: 'OTP expired' }, { status: 400 });

    const ok = await bcrypt.compare(code, customer.otpHash);
    if (!ok) return NextResponse.json({ success: false, message: 'Invalid code' }, { status: 401 });

    // clear otp and issue token
    await prisma.customer.update({ where: { id: customer.id }, data: { otpHash: null, otpExpires: null } });

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
    console.error(err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
