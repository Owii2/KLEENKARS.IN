import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Auto-delete sessions older than 7 days that are not permanent
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
      await prisma.chatSession.deleteMany({
        where: {
          isPermanent: false,
          updatedAt: {
            lt: sevenDaysAgo,
          },
        },
      });
    } catch (cleanupError) {
      console.error("Failed to auto-delete stale sessions:", cleanupError);
    }

    const sessions = await prisma.chatSession.findMany({
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Fetch sessions error:", error);
    return NextResponse.json({ error: "Failed to fetch chat sessions" }, { status: 500 });
  }
}
