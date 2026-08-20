import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";
import { hashPassword } from "@/lib/hash";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();
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

    let branchId = body.branchId;
    let branchName = body.branch;

    if (branchId !== undefined && branchName === undefined) {
      if (branchId) {
        const b = await prisma.branch.findUnique({ where: { id: branchId } });
        branchName = b?.name || null;
      } else {
        branchName = null;
      }
    } else if (branchName !== undefined && branchId === undefined) {
      if (branchName) {
        const b = await prisma.branch.findFirst({ where: { name: { equals: branchName, mode: "insensitive" } } });
        branchId = b?.id || null;
      } else {
        branchId = null;
      }
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
      branch: branchName !== undefined ? branchName : undefined,
      branchId: branchId !== undefined ? branchId : undefined,
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
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      employee,
    });
  } catch (error: any) {
    console.error("Update Employee Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update employee" },
      { status: 500 }
    );
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
    const employee = await prisma.employee.findUnique({ where: { id } });

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 });
    }

    await prisma.attendance.deleteMany({ where: { employeeId: id } });
    await prisma.payroll.deleteMany({ where: { employeeId: id } });
    await prisma.employee.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: `Employee ${employee.name} deleted successfully`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete employee" },
      { status: 500 }
    );
  }
}
