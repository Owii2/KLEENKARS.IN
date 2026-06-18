import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sendEmail } from '@/lib/email';
import twilio from 'twilio';

interface RequestResetBody {
  email?: string;
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json() as RequestResetBody;
    if (!email) return NextResponse.json({ success: false, message: 'email required' }, { status: 400 });
    
    // Find customer by email or phone
    const user = await prisma.customer.findFirst({
      where: {
        OR: [
          { email },
          { phoneNumber: email }
        ]
      }
    });
    if (!user) return NextResponse.json({ success: false, message: 'No user found' }, { status: 404 });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashed = await bcrypt.hash(code, 10);
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.customer.update({
      where: { id: user.id },
      data: { otpHash: hashed, otpExpires: expires }
    });

    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset OTP - Kleenkars',
        text: `Your password reset verification code is ${code}. It expires in 5 minutes.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; background-color: #111; color: white; border-radius: 12px; border: 1px solid #333; max-width: 400px; margin: auto;">
            <h2 style="color: #eab308; text-align: center;">Kleenkars Password Reset</h2>
            <p>Hello ${user.customerName},</p>
            <p>You requested a password reset. Your one-time OTP code is:</p>
            <div style="font-size: 32px; font-weight: bold; text-align: center; background-color: black; padding: 15px; border-radius: 8px; border: 1px solid #444; letter-spacing: 5px; color: #eab308; margin: 20px 0;">
              ${code}
            </div>
            <p style="color: #888; font-size: 12px; text-align: center;">This code is valid for 5 minutes. Please do not share this OTP with anyone.</p>
          </div>
        `
      });
    }

    // Also send via Twilio if configured
    if (user.phoneNumber && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM) {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
          body: `Your password reset code is ${code}`,
          from: process.env.TWILIO_FROM,
          to: user.phoneNumber
        });
      } catch (e) {
        console.error('Twilio send error', e);
      }
    }

    console.log(`Customer Password Reset OTP for ${user.customerName} (${user.phoneNumber} / ${user.email}): ${code}`);

    return NextResponse.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
