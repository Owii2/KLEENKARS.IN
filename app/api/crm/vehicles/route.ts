import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";

export async function GET() {
  const auth = await requireRoles(["admin", "manager", "supervisor"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        customer: {
          select: {
            customerName: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, vehicles });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch vehicles" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "manager", "supervisor"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { customerId, plateNumber, type, brand, model, color, value } = body;

    // Check for duplicate plateNumber if provided and not empty
    if (plateNumber && plateNumber.trim() !== "") {
      const existing = await prisma.vehicle.findUnique({
        where: { plateNumber: plateNumber.trim() },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, message: "Vehicle with this plate number already registered" },
          { status: 400 }
        );
      }
    }

    // Check if customer exists if customerId is provided
    if (customerId) {
      const customerExists = await prisma.customer.findUnique({
        where: { id: customerId },
      });
      if (!customerExists) {
        return NextResponse.json(
          { success: false, message: "Associated Customer ID not found" },
          { status: 400 }
        );
      }
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        customerId: customerId || null,
        plateNumber: plateNumber ? plateNumber.trim() : null,
        type: type || null,
        brand: brand || null,
        model: model || null,
        color: color || null,
        value: value ? parseInt(value, 10) : null,
      },
    });

    return NextResponse.json({ success: true, vehicle });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create vehicle" },
      { status: 500 }
    );
  }
}
