import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireRoles } from "@/lib/apiAuth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();

    const dataToUpdate: any = {};

    if (body.customerName !== undefined) dataToUpdate.customerName = body.customerName;
    if (body.phoneNumber !== undefined) dataToUpdate.phoneNumber = body.phoneNumber;
    if (body.email !== undefined) dataToUpdate.email = body.email;
    if (body.vehicleType !== undefined) dataToUpdate.vehicleType = body.vehicleType;
    if (body.isBlacklisted !== undefined) dataToUpdate.isBlacklisted = body.isBlacklisted;
    if (body.tag !== undefined) dataToUpdate.tag = body.tag;

    if (body.password) {
      dataToUpdate.password = await bcrypt.hash(body.password, 10);
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
