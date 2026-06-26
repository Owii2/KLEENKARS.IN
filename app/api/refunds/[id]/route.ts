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
    const { amount, reason, paymentMode, status } = body;

    const existing = await prisma.refund.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Refund record not found" }, { status: 404 });
    }

    const refund = await prisma.refund.update({
      where: { id },
      data: {
        amount: amount !== undefined ? Number(amount) : undefined,
        reason: reason !== undefined ? reason : undefined,
        paymentMode: paymentMode !== undefined ? paymentMode : undefined,
        status: status !== undefined ? status : undefined,
      },
    });

    return NextResponse.json({ success: true, refund });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to update refund record" }, { status: 500 });
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
    await prisma.refund.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to delete refund record" }, { status: 500 });
  }
}
