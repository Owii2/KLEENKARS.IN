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
    const { name, price, durationDays, benefits } = body;

    const existing = await prisma.membershipPlan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Membership plan not found" }, { status: 404 });
    }

    const plan = await prisma.membershipPlan.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        price: price !== undefined ? Number(price) : undefined,
        durationDays: durationDays !== undefined ? Number(durationDays) : undefined,
        benefits: benefits !== undefined ? (typeof benefits === "string" ? benefits : JSON.stringify(benefits)) : undefined,
      },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to update membership plan" }, { status: 500 });
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
    await prisma.membershipPlan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to delete membership plan" }, { status: 500 });
  }
}
