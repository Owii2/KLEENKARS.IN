import { prisma } from "@/lib/prisma";

import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";

export async function GET() {
  const auth = await requireRoles(["admin", "manager", "supervisor"]);

  if (auth.response) {
    return auth.response;
  }

  const attendance =
    await prisma.attendance.findMany({

      orderBy: {
        checkIn: "desc",
      },

    });

  return NextResponse.json({
    attendance,
  });
}

export async function POST(
  req: Request
) {
  const auth = await requireRoles(["admin", "manager", "supervisor"]);

  if (auth.response) {
    return auth.response;
  }

  try {

    const body = await req.json();

    const attendance =
      await prisma.attendance.create({

        data: {

          employeeId:
            body.employeeId,

          employeeCode:
            body.employeeCode,

          employeeName:
            body.employeeName,

          attendanceStatus:
            body.attendanceStatus,

        },

      });

    return NextResponse.json({
      success: true,
      attendance,
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

