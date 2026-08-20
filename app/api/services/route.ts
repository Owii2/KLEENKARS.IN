import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/apiAuth";
import { createApprovalRequest } from "@/lib/approval";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(
      { success: true, services },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/services error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const service = await prisma.service.create({
      data: {
        name: body.name,
        description: body.description,
        price: body.price,
        category: body.category,
        isActive: body.isActive ?? true,
      },
    });

    if (user.role === "manager") {
      await createApprovalRequest("Service", service.id, "CREATE", user.id, user.name, null, service);
    }

    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error("POST /api/services error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
