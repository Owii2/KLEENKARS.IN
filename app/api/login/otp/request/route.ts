import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/email";
import twilio from "twilio";

interface LoginOtpRequestBody {
  identifier?: string;
  method?: "email" | "mobile";
}

export async function POST(req: Request) {
  try {
    const { identifier, method } = await req.json() as LoginOtpRequestBody;

    if (!identifier) {
      return NextResponse.json({ success: false, message: "Missing identifier" }, { status: 400 });
    }

    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { phoneNumber: identifier },
          { email: identifier },
          { employeeCode: identifier }
        ]
      }
    });

    if (!employee) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashed = await bcrypt.hash(code, 10);
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.employee.update({
      where: { id: employee.id },
      data: { otpHash: hashed, otpExpires: expires }
    });

    const sentVia: string[] = [];

    // Send via Email if requested
    if ((method === "email" || !method) && employee.email) {
      const emailResult = await sendEmail({
        to: employee.email,
        subject: "Login OTP - Kleenkars",
        text: `Your login verification code is ${code}. It expires in 5 minutes.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; background-color: #111; color: white; border-radius: 12px; border: 1px solid #333; max-width: 400px; margin: auto;">
            <h2 style="color: #ff2d2d; text-align: center;">Kleenkars verification code</h2>
            <p>Hello ${employee.name},</p>
            <p>Your one-time login verification OTP code is:</p>
            <div style="font-size: 32px; font-weight: bold; text-align: center; background-color: black; padding: 15px; border-radius: 8px; border: 1px solid #444; letter-spacing: 5px; color: #ff2d2d; margin: 20px 0;">
              ${code}
            </div>
            <p style="color: #888; font-size: 12px; text-align: center;">This code is valid for 5 minutes. Please do not share this OTP with anyone.</p>
          </div>
        `
      });
      if (emailResult.success) {
        sentVia.push("email");
      }
    }

    // Send via Mobile if requested
    if ((method === "mobile" || !method) && employee.phoneNumber && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM) {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
          body: `Your login code is ${code}`,
          from: process.env.TWILIO_FROM,
          to: employee.phoneNumber
        });
        sentVia.push("mobile");
      } catch (e) {
        console.error('Twilio send error', e);
      }
    }

    // Log to console for local testing
    console.log(`Login OTP for ${employee.name} (method: ${method}): ${code}`);

    if (method === "email" && !employee.email) {
      return NextResponse.json({ success: false, message: "No email registered for this user" });
    }

    if (method === "mobile" && !employee.phoneNumber) {
      return NextResponse.json({ success: false, message: "No mobile number registered for this user" });
    }

    return NextResponse.json({ success: true, message: `OTP sent to ${sentVia.join(" and ") || method || "your registered contact"}` });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
