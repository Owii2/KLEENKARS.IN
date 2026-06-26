import { prisma } from "@/lib/prisma";

import { NextResponse } from "next/server";
import { requireRoles, getCurrentUser } from "@/lib/apiAuth";


export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (user.role === "customer") {
    try {
      const booking = await prisma.booking.findUnique({ where: { id } });
      if (!booking || booking.customerId !== user.id) {
        return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
      }

      const body = await req.json();
      if (body.status !== "Cancelled") {
        return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
      }

      const updated = await prisma.booking.update({
        where: { id },
        data: { status: "Cancelled" },
      });

      return NextResponse.json({ success: true, booking: updated });
    } catch (error) {
      console.log(error);
      return NextResponse.json({ success: false, message: "Cancellation failed" }, { status: 500 });
    }
  }

  const auth = await requireRoles(["admin", "manager", "supervisor", "staff"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const data: any = {};
    if (body.customerName !== undefined) data.customerName = body.customerName;
    if (body.phoneNumber !== undefined) data.phoneNumber = body.phoneNumber;
    if (body.bookingDate !== undefined) data.bookingDate = body.bookingDate;
    if (body.bookingTime !== undefined) data.bookingTime = body.bookingTime;
    if (body.totalCost !== undefined) data.totalCost = Math.round(Number(body.totalCost));
    if (body.discount !== undefined) data.discount = Math.round(Number(body.discount));
    if (body.finalAmount !== undefined) data.finalAmount = Math.round(Number(body.finalAmount));
    if (body.assignedEmployeeId !== undefined) data.assignedEmployeeId = body.assignedEmployeeId;
    if (body.assignedEmployeeName !== undefined) data.assignedEmployeeName = body.assignedEmployeeName;
    if (body.status !== undefined) data.status = body.status;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.startedAt !== undefined) data.startedAt = body.startedAt ? new Date(body.startedAt) : null;
    if (body.completedAt !== undefined) data.completedAt = body.completedAt ? new Date(body.completedAt) : null;

    const booking = await prisma.booking.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      success: true,
      booking,
    });

  } catch (error) {

    console.log(error);

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(["admin", "manager", "supervisor", "staff"]);

  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await params;

    await prisma.booking.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
