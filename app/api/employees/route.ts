import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/hash";
import { requireRoles } from "@/lib/apiAuth";

export async function GET() {
  const auth = await requireRoles(["admin", "manager", "supervisor"]);
  if (auth.response) return auth.response;

  try {
    const employees = await prisma.employee.findMany({
      include: {
        branchRel: {
          select: { id: true, code: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      employees,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();

    if (body.role === "admin" || (body.role === "manager" && auth.user?.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Insufficient role permissions" },
        { status: 403 }
      );
    }

    let branchId = body.branchId || null;
    let branchName = body.branch || null;

    if (branchId && !branchName) {
      const b = await prisma.branch.findUnique({ where: { id: branchId } });
      if (b) branchName = b.name;
    } else if (branchName && !branchId) {
      const b = await prisma.branch.findFirst({ where: { name: { equals: branchName, mode: "insensitive" } } });
      if (b) branchId = b.id;
    }

    const employee = await prisma.employee.create({
      data: {
        employeeCode: body.employeeCode,
        name: body.name,
        phoneNumber: body.phoneNumber,
        password: await hashPassword(body.password),
        role: body.role,
        salaryPerDay: Number(body.salaryPerDay),
        email: body.email && body.email.trim() !== "" ? body.email.trim() : null,
        aadhaarNumber: body.aadhaarNumber || null,
        address: body.address || null,
        emergencyContact: body.emergencyContact || null,
        branch: branchName,
        branchId: branchId,
        shiftType: body.shiftType || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      employee,
    });
  } catch (error: any) {
    console.error("Create Employee Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create employee" },
      { status: 500 }
    );
  }
}
