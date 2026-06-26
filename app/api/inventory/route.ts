import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";

export async function GET() {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { name, quantity, unit, minStock, costPerUnit } = body;

    if (!name || quantity === undefined || !unit || costPerUnit === undefined) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        quantity: Number(quantity),
        unit,
        minStock: minStock !== undefined ? Number(minStock) : 5,
        costPerUnit: Number(costPerUnit),
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to create inventory item" }, { status: 500 });
  }
}
