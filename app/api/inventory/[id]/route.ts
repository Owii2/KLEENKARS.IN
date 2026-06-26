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
    const { name, quantity, unit, minStock, costPerUnit } = body;

    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Inventory item not found" }, { status: 404 });
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        quantity: quantity !== undefined ? Number(quantity) : undefined,
        unit: unit !== undefined ? unit : undefined,
        minStock: minStock !== undefined ? Number(minStock) : undefined,
        costPerUnit: costPerUnit !== undefined ? Number(costPerUnit) : undefined,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to update inventory item" }, { status: 500 });
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
    await prisma.inventoryItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to delete inventory item" }, { status: 500 });
  }
}
