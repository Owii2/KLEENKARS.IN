import { prisma } from "@/lib/prisma";

import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";


export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(["admin", "manager", "supervisor", "staff"]);

  if (auth.response) {
    return auth.response;
  }

  try {

    const body = await req.json();
    const { id } = await params;

    const booking =
      await prisma.booking.update({

        where: {
          id,
        },

        data: {

          totalCost:
            body.totalCost,

          assignedEmployeeId:
            body.assignedEmployeeId,

          assignedEmployeeName:
            body.assignedEmployeeName,

          status:
            body.status,

        },

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
