import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createToken, sanitizeIdentifier } from "@/lib/auth";
import { serialize } from "cookie";

export async function POST(req: Request) {
  try {
    const { identifier: rawIdentifier, otp } = await req.json();

    if (!rawIdentifier || !otp) {
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

    // Clear OTP
    await prisma.employee.update({
      where: { id: employee.id },
      data: { otpHash: null, otpExpires: null }
    });

    // Create token
    const token = createToken({
      id: employee.id,
      role: employee.role,
      name: employee.name,
    });

    const response = NextResponse.json({
      success: true,
      role: employee.role,
    });

    response.headers.set(
      "Set-Cookie",
      serialize("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      })
    );

    return response;
  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
