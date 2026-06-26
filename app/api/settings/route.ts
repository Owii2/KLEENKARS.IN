import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: "asc" },
    });
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ success: false, message: "Key and value are required" }, { status: 400 });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });

    return NextResponse.json({ success: true, setting });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to update system settings" }, { status: 500 });
  }
}
