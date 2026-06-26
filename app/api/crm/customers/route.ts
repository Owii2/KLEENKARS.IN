import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";
import { generateNextCustomerId } from "@/lib/auth";

export async function GET() {
  const auth = await requireRoles(["admin", "manager", "supervisor"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, customers });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "manager", "supervisor"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { customerName, phoneNumber, whatsAppNumber, email, notes } = body;

    // Check for duplicate phoneNumber if provided and not empty
    if (phoneNumber && phoneNumber.trim() !== "") {
      const existing = await prisma.customer.findUnique({
        where: { phoneNumber: phoneNumber.trim() },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, message: "Customer with this phone number already exists" },
          { status: 400 }
        );
      }
    }

    // Check for duplicate email if provided and not empty
    if (email && email.trim() !== "") {
      const existing = await prisma.customer.findUnique({
        where: { email: email.trim() },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, message: "Customer with this email already exists" },
          { status: 400 }
        );
      }
    }

    const nextId = await generateNextCustomerId();
    const customer = await prisma.customer.create({
      data: {
        id: nextId,
        customerName: customerName || null,
        phoneNumber: phoneNumber || null,
        whatsAppNumber: whatsAppNumber || null,
        email: email || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create customer" },
      { status: 500 }
    );
  }
}
