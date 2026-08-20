import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/apiAuth";

// POST /api/branches/[id]/assign - Assign or reassign staff
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const { employeeIds = [] } = await req.json();

    const branch = await prisma.branch.findUnique({
      where: { id },
    });

    if (!branch) {
      return NextResponse.json({ success: false, message: "Branch not found" }, { status: 404 });
    }

    // Assign employees
    await prisma.employee.updateMany({
      where: { id: { in: employeeIds } },
      data: {
        branchId: branch.id,
        branch: branch.name,
      },
    });

    const updatedEmployees = await prisma.employee.findMany({
      where: { branchId: branch.id },
      select: { id: true, name: true, employeeCode: true, role: true, status: true },
    });

    return NextResponse.json({
      success: true,
      message: `${employeeIds.length} staff assigned to ${branch.name}`,
      employees: updatedEmployees,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
