import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/hash";
import { requireRoles } from "@/lib/apiAuth";


export async function GET() {
  const auth = await requireRoles(["admin", "manager", "supervisor"]);

  if (auth.response) {
    return auth.response;
  }

  const employees = await prisma.employee.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({
    employees,
  });
}

export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "manager"]);

  if (auth.response) {
    return auth.response;
  }

  try {

    const body = await req.json();

    if (body.role === "admin" || (body.role === "manager" && auth.user?.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Insufficient role permissions" },
        { status: 403 }
      );
    }

    const employee = await prisma.employee.create({
      data: {
        employeeCode: body.employeeCode,
        name: body.name,
        phoneNumber: body.phoneNumber,
        password: await hashPassword(body.password),
        role: body.role,
        salaryPerDay: body.salaryPerDay,
        email: body.email && body.email.trim() !== "" ? body.email.trim() : null,
        aadhaarNumber: body.aadhaarNumber || null,
        address: body.address || null,
        emergencyContact: body.emergencyContact || null,
        branch: body.branch || null,
        shiftType: body.shiftType || null,
        notes: body.notes || null,
      },
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
