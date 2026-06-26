import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const knowledge = await prisma.chatBotKnowledge.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(knowledge);
  } catch (error) {
    console.error("Fetch knowledge error:", error);
    return NextResponse.json({ error: "Failed to fetch knowledge base" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { question, answer } = await request.json();
    if (!question || !answer) {
      return NextResponse.json({ error: "Question and Answer are required" }, { status: 400 });
    }

    const entry = await prisma.chatBotKnowledge.create({
      data: { question, answer },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Create knowledge error:", error);
    return NextResponse.json({ error: "Failed to add knowledge base entry" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idStr = searchParams.get("id");
    if (!idStr) {
      return NextResponse.json({ error: "Knowledge ID is required" }, { status: 400 });
    }

    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    await prisma.chatBotKnowledge.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete knowledge error:", error);
    return NextResponse.json({ error: "Failed to delete knowledge entry" }, { status: 500 });
  }
}
