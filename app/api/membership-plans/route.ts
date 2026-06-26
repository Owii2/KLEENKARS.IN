import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";

export async function GET() {
  try {
    const plans = await prisma.membershipPlan.findMany({
      orderBy: { price: "asc" },
    });
    return NextResponse.json({ success: true, plans });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to fetch membership plans" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { name, price, durationDays, benefits } = body;

    if (!name || price === undefined || durationDays === undefined) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const plan = await prisma.membershipPlan.create({
      data: {
        name,
        price: Number(price),
        durationDays: Number(durationDays),
        benefits: benefits ? (typeof benefits === "string" ? benefits : JSON.stringify(benefits)) : null,
      },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to create membership plan" }, { status: 500 });
  }
}
