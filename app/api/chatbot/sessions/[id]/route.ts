import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await prisma.chatSession.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Fetch single session error:", error);
    return NextResponse.json({ error: "Failed to fetch chat session details" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { isPermanent } = await request.json();

    if (typeof isPermanent !== "boolean") {
      return NextResponse.json({ error: "isPermanent must be a boolean" }, { status: 400 });
    }

    const updated = await prisma.chatSession.update({
      where: { id },
      data: { isPermanent },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update session error:", error);
    return NextResponse.json({ error: "Failed to update chat session" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.chatSession.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete session error:", error);
    return NextResponse.json({ error: "Failed to delete chat session" }, { status: 500 });
  }
}
