import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";

// GET /api/expenses/payment-modes - List payment modes
export async function GET(req: Request) {
  const auth = await requireRoles(["admin", "manager", "supervisor", "staff"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const paymentModes = await prisma.paymentMode.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, paymentModes });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch payment modes" },
      { status: 500 }
    );
  }
}

// POST /api/expenses/payment-modes - Add payment mode (Admin only)
export async function POST(req: Request) {
  const auth = await requireRoles(["admin"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { name } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Payment mode name is required" },
        { status: 400 }
      );
    }

    const paymentMode = await prisma.paymentMode.create({
      data: { name: name.trim() },
    });

    return NextResponse.json({ success: true, paymentMode });
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, message: "Payment mode already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Failed to create payment mode" },
      { status: 500 }
    );
  }
}
