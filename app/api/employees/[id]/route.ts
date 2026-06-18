import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";

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

    const employee =
      await prisma.employee.update({

        where: {
          id,
        },

        data: {

          employeeCode: body.employeeCode,

          name: body.name,

          phoneNumber: body.phoneNumber,

          role: body.role,

          status: body.status,

          salaryPerDay:
            body.salaryPerDay,

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
