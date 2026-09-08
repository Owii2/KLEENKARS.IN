import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireRoles } from "@/lib/apiAuth";

interface CustomerUpdateRequest {
  customerName?: string;
  phoneNumber?: string;
  email?: string | null;
  vehicleType?: string | null;
  isBlacklisted?: boolean;
  tag?: string | null;
  password?: string;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const body = (await req.json()) as CustomerUpdateRequest;

    const cleanPhone =
      body.phoneNumber && body.phoneNumber.trim() !== "" && body.phoneNumber.toUpperCase() !== "N/A"
        ? body.phoneNumber.trim()
        : null;

    const cleanEmail =
      body.email && body.email.trim() !== "" && body.email.toUpperCase() !== "N/A"
        ? body.email.trim()
        : null;

    // Check if phone number conflicts with an existing customer
    if (cleanPhone) {
      const existingByPhone = await prisma.customer.findUnique({
        where: { phoneNumber: cleanPhone },
      });
      if (existingByPhone && existingByPhone.id !== id) {
        return NextResponse.json(
          {
            success: false,
            message: `Phone number ${cleanPhone} is already registered to ${existingByPhone.customerName || "another customer"}.`,
          },
          { status: 400 }
        );
      }
    }

    // Check if customer exists in database
    const existingCust = await prisma.customer.findUnique({ where: { id } });

    let customer;
    if (existingCust) {
      customer = await prisma.customer.update({
        where: { id },
        data: {
          customerName: body.customerName !== undefined ? body.customerName.trim() : existingCust.customerName,
          phoneNumber: cleanPhone !== undefined ? cleanPhone : existingCust.phoneNumber,
          email: cleanEmail !== undefined ? cleanEmail : existingCust.email,
          vehicleType: body.vehicleType !== undefined ? body.vehicleType : existingCust.vehicleType,
          isBlacklisted: body.isBlacklisted !== undefined ? body.isBlacklisted : existingCust.isBlacklisted,
          tag: body.tag !== undefined ? body.tag : existingCust.tag,
          primaryCategory: (body.tag ? body.tag : existingCust.primaryCategory) || "REGULAR",
          ...(body.password ? { password: await bcrypt.hash(body.password, 10) } : {}),
        },
      });
    } else {
      // Customer record originated from aggregated transactions, create it in DB
      customer = await prisma.customer.create({
        data: {
          customerName: body.customerName ? body.customerName.trim() : "Customer",
          phoneNumber: cleanPhone,
          email: cleanEmail,
          vehicleType: body.vehicleType || null,
          isBlacklisted: body.isBlacklisted || false,
          tag: body.tag || "REGULAR",
          primaryCategory: body.tag || "REGULAR",
          ...(body.password ? { password: await bcrypt.hash(body.password, 10) } : {}),
        },
      });
    }

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update customer." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (existing) {
      await prisma.customer.delete({ where: { id } });
    }
    return NextResponse.json({ success: true, message: "Customer deleted successfully." });
  } catch (error: any) {
    console.error("Error deleting customer:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to delete customer." }, { status: 500 });
  }
}
