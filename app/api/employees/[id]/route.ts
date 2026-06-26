import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";
import { hashPassword } from "@/lib/hash";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(["admin", "manager"]);

  if (auth.response) {
    return auth.response;
  }

  try {

    const body = await req.json();
    const { id } = await params;
    const existingEmployee = await prisma.employee.findUnique({ where: { id } });

    if (!existingEmployee) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }

    if (
      auth.user?.role !== "admin" &&
      (existingEmployee.role === "manager" ||
        body.role === "manager" ||
        body.role === "admin")
    ) {
      return NextResponse.json(
        { success: false, message: "Insufficient role permissions" },
        { status: 403 }
      );
    }

    const updateData: any = {
      employeeCode: body.employeeCode,
      name: body.name,
      phoneNumber: body.phoneNumber,
      role: body.role,
      status: body.status,
      salaryPerDay: body.salaryPerDay !== undefined ? Number(body.salaryPerDay) : undefined,
      email: body.email !== undefined ? (body.email && body.email.trim() !== "" ? body.email.trim() : null) : undefined,
      aadhaarNumber: body.aadhaarNumber,
      address: body.address,
      emergencyContact: body.emergencyContact,
      branch: body.branch,
      shiftType: body.shiftType,
      notes: body.notes,
      jobsCompleted: body.jobsCompleted !== undefined ? Number(body.jobsCompleted) : undefined,
      revenueGenerated: body.revenueGenerated !== undefined ? Number(body.revenueGenerated) : undefined,
      totalUpsells: body.totalUpsells !== undefined ? Number(body.totalUpsells) : undefined,
      attendancePercent: body.attendancePercent !== undefined ? Number(body.attendancePercent) : undefined,
      customerRating: body.customerRating !== undefined ? Number(body.customerRating) : undefined,
      penalties: body.penalties !== undefined ? Number(body.penalties) : undefined,
      incentives: body.incentives !== undefined ? Number(body.incentives) : undefined,
    };

    if (body.password && body.password.trim() !== "") {
      updateData.password = await hashPassword(body.password);
    }

    const employee = await prisma.employee.update({
      where: {
        id,
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      employee,
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
  const auth = await requireRoles(["admin", "manager"]);

  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await params;
    await prisma.employee.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false, message: "Delete failed" }, { status: 550 });
  }
}
