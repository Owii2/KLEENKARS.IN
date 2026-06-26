import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";

// PUT /api/expenses/payment-modes/[id] - Toggle status or rename payment mode (Admin only)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(["admin"]);
  if (auth.response) {
    return auth.response;
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { name, disabled } = body;

    const paymentMode = await prisma.paymentMode.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        disabled: disabled !== undefined ? disabled : undefined,
      },
    });

    return NextResponse.json({ success: true, paymentMode });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to update payment mode" },
      { status: 500 }
    );
  }
}

// DELETE /api/expenses/payment-modes/[id] - Delete payment mode (Admin only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(["admin"]);
  if (auth.response) {
    return auth.response;
  }

  const { id } = await params;

  try {
    await prisma.paymentMode.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, message: "Payment mode deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to delete payment mode" },
      { status: 500 }
    );
  }
}
