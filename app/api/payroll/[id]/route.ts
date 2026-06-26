import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, workingDays, dailyWage, advances, deductions, netPayable } = body;

    const existing = await prisma.payroll.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Payroll record not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === "Paid") {
        updateData.paidAt = new Date();
      } else {
        updateData.paidAt = null;
      }
    }
    if (workingDays !== undefined) updateData.workingDays = Number(workingDays);
    if (dailyWage !== undefined) updateData.dailyWage = Number(dailyWage);
    if (advances !== undefined) updateData.advances = Number(advances);
    if (deductions !== undefined) updateData.deductions = Number(deductions);
    if (netPayable !== undefined) updateData.netPayable = Number(netPayable);

    const payroll = await prisma.payroll.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, payroll });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to update payroll" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    await prisma.payroll.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to delete payroll record" }, { status: 500 });
  }
}
