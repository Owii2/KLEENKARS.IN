import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRoles(["admin"]);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const { action } = await req.json(); // "APPROVE" or "REJECT"

    const approval = await prisma.approvalRequest.findUnique({ where: { id } });
    if (!approval) return NextResponse.json({ success: false, message: "Request not found" }, { status: 404 });
    if (approval.status !== "PENDING") return NextResponse.json({ success: false, message: "Request already processed" }, { status: 400 });

    if (action === "APPROVE") {
      await prisma.approvalRequest.update({
        where: { id },
        data: { status: "APPROVED" }
      });
      return NextResponse.json({ success: true, message: "Approved successfully" });
    }

    if (action === "REJECT") {
      // Revert changes
      if (approval.action === "CREATE") {
        // Delete it
        if (approval.entityType === "Service" && approval.entityId) await prisma.service.delete({ where: { id: approval.entityId } }).catch(e => console.error(e));
        if (approval.entityType === "Offer" && approval.entityId) await prisma.offer.delete({ where: { id: approval.entityId } }).catch(e => console.error(e));
      } else if (approval.action === "UPDATE" && approval.previousData) {
        // Restore previous data
        const oldData = JSON.parse(approval.previousData);
        if (approval.entityType === "Service" && approval.entityId) await prisma.service.update({ where: { id: approval.entityId }, data: oldData }).catch(e => console.error(e));
        if (approval.entityType === "Offer" && approval.entityId) await prisma.offer.update({ where: { id: approval.entityId }, data: oldData }).catch(e => console.error(e));
      } else if (approval.action === "DELETE" && approval.previousData) {
        // Recreate it
        const oldData = JSON.parse(approval.previousData);
        if (approval.entityType === "Service") await prisma.service.create({ data: oldData }).catch(e => console.error(e));
        if (approval.entityType === "Offer") await prisma.offer.create({ data: oldData }).catch(e => console.error(e));
      }

      await prisma.approvalRequest.update({
        where: { id },
        data: { status: "REJECTED" }
      });

      return NextResponse.json({ success: true, message: "Rejected and changes reverted" });
    }

    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
