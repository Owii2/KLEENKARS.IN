import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";

// PUT /api/expenses/categories/[id] - Toggle disable/enable or rename category (Admin only)
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

    const category = await prisma.expenseCategory.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        disabled: disabled !== undefined ? disabled : undefined,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE /api/expenses/categories/[id] - Delete category (Admin only)
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
    await prisma.expenseCategory.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to delete category" },
      { status: 500 }
    );
  }
}
