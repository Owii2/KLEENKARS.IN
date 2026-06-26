import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { sanitizeIdentifier } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { identifier: rawIdentifier, otp, newPassword } = await req.json();

    if (!rawIdentifier || !otp || !newPassword) {
      return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
    }

    const identifier = sanitizeIdentifier(rawIdentifier);

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

    if (!employee.otpHash || !employee.otpExpires) {
      return NextResponse.json({ success: false, message: "No OTP request found" }, { status: 400 });
    }

    if (new Date() > employee.otpExpires) {
      return NextResponse.json({ success: false, message: "OTP expired" }, { status: 400 });
    }

    const isValid = await bcrypt.compare(otp, employee.otpHash);
    if (!isValid) {
      return NextResponse.json({ success: false, message: "Invalid OTP" }, { status: 400 });
    }

    const hashed = await hashPassword(newPassword);

    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        password: hashed,
        otpHash: null,
        otpExpires: null
      }
    });

    return NextResponse.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
