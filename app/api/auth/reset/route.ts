import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, otp, password } = await req.json();
    if (!email || !otp || !password) {
      return NextResponse.json({ success: false, message: 'email/phone, otp and password required' }, { status: 400 });
    }

    const user = await prisma.customer.findFirst({
      where: {
        OR: [
          { email },
          { phoneNumber: email }
        ]
      }
    });

    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    if (!user.otpHash || !user.otpExpires) return NextResponse.json({ success: false, message: 'No active OTP request' }, { status: 400 });
    if (new Date() > user.otpExpires) return NextResponse.json({ success: false, message: 'OTP has expired' }, { status: 400 });

    const isValid = await bcrypt.compare(otp, user.otpHash);
    if (!isValid) return NextResponse.json({ success: false, message: 'Invalid OTP code' }, { status: 400 });

    const hashed = await bcrypt.hash(password, 10);
    await prisma.customer.update({
      where: { id: user.id },
      data: {
        password: hashed,
        otpHash: null,
        otpExpires: null
      }
    });

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
