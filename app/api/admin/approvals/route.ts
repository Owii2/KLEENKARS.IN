import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";

export async function GET() {
  const auth = await requireRoles(["admin"]);
  if (auth.response) return auth.response;

  try {
    const approvals = await prisma.approvalRequest.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const settings = await prisma.systemSetting.findUnique({
      where: { key: "AUTO_APPROVAL_DAYS" }
    });
    const autoApprovalDays = settings ? parseInt(settings.value) : 3;

    return NextResponse.json({ success: true, approvals, autoApprovalDays });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireRoles(["admin"]);
  if (auth.response) return auth.response;

  try {
    const { autoApprovalDays } = await req.json();

    if (autoApprovalDays !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: "AUTO_APPROVAL_DAYS" },
        update: { value: autoApprovalDays.toString() },
        create: { key: "AUTO_APPROVAL_DAYS", value: autoApprovalDays.toString() }
      });

      // Update expiresAt for pending requests
      const days = parseInt(autoApprovalDays);
      const pending = await prisma.approvalRequest.findMany({ where: { status: "PENDING" } });
      
      for (const req of pending) {
        const newExpiresAt = new Date(req.createdAt.getTime() + days * 24 * 60 * 60 * 1000);
        await prisma.approvalRequest.update({
          where: { id: req.id },
          data: { expiresAt: newExpiresAt }
        });
      }

      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
