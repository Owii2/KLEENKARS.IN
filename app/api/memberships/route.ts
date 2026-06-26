import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";

export async function GET() {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const memberships = await prisma.membership.findMany({
      include: {
        customer: true,
        membershipPlan: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, memberships });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to fetch memberships" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { customerId, membershipPlanId, startDate, endDate, status } = body;

    if (!customerId || !membershipPlanId || !startDate) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const plan = await prisma.membershipPlan.findUnique({
      where: { id: membershipPlanId },
    });

    if (!plan) {
      return NextResponse.json({ success: false, message: "Membership plan not found" }, { status: 404 });
    }

    // Calculate endDate if not provided
    let calculatedEndDate = endDate ? new Date(endDate) : null;
    if (!calculatedEndDate) {
      const start = new Date(startDate);
      start.setDate(start.getDate() + plan.durationDays);
      calculatedEndDate = start;
    }

    const membership = await prisma.membership.create({
      data: {
        customerId,
        membershipPlanId,
        startDate: new Date(startDate),
        endDate: calculatedEndDate,
        status: status || "ACTIVE",
      },
      include: {
        customer: true,
        membershipPlan: true,
      },
    });

    return NextResponse.json({ success: true, membership });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to assign membership" }, { status: 500 });
  }
}
