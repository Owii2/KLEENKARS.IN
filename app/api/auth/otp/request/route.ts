import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import twilio from 'twilio';

interface OtpRequestBody {
  phoneNumber?: string;
}

export async function POST(req: Request) {
  try {
    const { phoneNumber } = await req.json() as OtpRequestBody;
    if (!phoneNumber) return NextResponse.json({ success: false, message: 'phoneNumber required' }, { status: 400 });

    // generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashed = await bcrypt.hash(code, 10);
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // find or create customer
    let customer = await prisma.customer.findUnique({ where: { phoneNumber } });
    if (!customer) {
      customer = await prisma.customer.create({ data: { phoneNumber, customerName: 'Guest' } });
    }

    await prisma.customer.update({ where: { id: customer.id }, data: { otpHash: hashed, otpExpires: expires } });

    // send via Twilio if configured
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM) {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({ body: `Your verification code is ${code}`, from: process.env.TWILIO_FROM, to: phoneNumber });
      } catch (e) {
        console.error('Twilio send error', e);
      }
    } else {
      // For local testing, log code to server console (do not return it in response)
      console.log(`OTP for ${phoneNumber}: ${code}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
