import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";

export async function GET() {
  const auth = await requireRoles(["admin", "manager", "supervisor"]);
  if (auth.response) return auth.response;

  try {
    const customers = await prisma.customer.findMany({ where: { referralCode: { not: null } }, orderBy: { referralPoints: 'desc' } });
    return NextResponse.json({ success: true, customers });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ success: false, message: 'Failed' }, { status: 500 });
  }
}
