import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("all") === "true";

    const links = await prisma.hubLink.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(
      { success: true, links },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/hub-links error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.title || !body.url) {
      return NextResponse.json(
        { success: false, message: "Title and URL are required" },
        { status: 400 }
      );
    }

    // Determine highest order
    const lastLink = await prisma.hubLink.findFirst({
      orderBy: { order: "desc" },
    });
    const nextOrder = (lastLink?.order ?? 0) + 1;

    const link = await prisma.hubLink.create({
      data: {
        title: body.title.trim(),
        subtitle: body.subtitle ? body.subtitle.trim() : null,
        url: body.url.trim(),
        icon: body.icon || "globe",
        badge: body.badge ? body.badge.trim() : null,
        bgColor: body.bgColor || null,
        textColor: body.textColor || null,
        isFeatured: Boolean(body.isFeatured),
        isActive: body.isActive ?? true,
        order: body.order ?? nextOrder,
      },
    });

    return NextResponse.json({ success: true, link });
  } catch (error) {
    console.error("POST /api/hub-links error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
