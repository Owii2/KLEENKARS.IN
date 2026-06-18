import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(["admin", "manager", "supervisor"]);

  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await params;
    await prisma.attendance.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
