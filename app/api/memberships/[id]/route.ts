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
    const { status, endDate } = body;

    const existing = await prisma.membership.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Membership not found" }, { status: 404 });
    }

    const membership = await prisma.membership.update({
      where: { id },
      data: {
        status: status !== undefined ? status : undefined,
        endDate: endDate !== undefined ? new Date(endDate) : undefined,
      },
    });

    return NextResponse.json({ success: true, membership });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to update membership" }, { status: 500 });
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
    await prisma.membership.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to delete membership" }, { status: 500 });
  }
}
