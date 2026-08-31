import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const link = await prisma.hubLink.findUnique({ where: { id } });
    if (!link) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, link });
  } catch (error) {
    console.error("GET /api/hub-links/[id] error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.hubLink.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }

    const updated = await prisma.hubLink.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title.trim() : existing.title,
        subtitle: body.subtitle !== undefined ? (body.subtitle ? body.subtitle.trim() : null) : existing.subtitle,
        url: body.url !== undefined ? body.url.trim() : existing.url,
        icon: body.icon !== undefined ? body.icon : existing.icon,
        badge: body.badge !== undefined ? (body.badge ? body.badge.trim() : null) : existing.badge,
        bgColor: body.bgColor !== undefined ? body.bgColor : existing.bgColor,
        textColor: body.textColor !== undefined ? body.textColor : existing.textColor,
        isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : existing.isFeatured,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
        order: body.order !== undefined ? Number(body.order) : existing.order,
      },
    });

    return NextResponse.json({ success: true, link: updated });
  } catch (error) {
    console.error("PUT /api/hub-links/[id] error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.hubLink.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }

    await prisma.hubLink.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/hub-links/[id] error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
