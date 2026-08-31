import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { items } = body as { items: Array<{ id: string; order: number }> };

    if (!Array.isArray(items)) {
      return NextResponse.json({ success: false, message: "Invalid payload" }, { status: 400 });
    }

    await prisma.$transaction(
      items.map((item) =>
        prisma.hubLink.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    return NextResponse.json({ success: true, message: "Order updated" });
  } catch (error) {
    console.error("POST /api/hub-links/reorder error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
