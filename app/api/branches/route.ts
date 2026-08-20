import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/apiAuth";

// GET /api/branches - List all branches with employee relations
export async function GET() {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const branches = await prisma.branch.findMany({
      include: {
        employees: {
          select: {
            id: true,
            employeeCode: true,
            name: true,
            role: true,
            status: true,
            phoneNumber: true,
            customerRating: true,
            jobsCompleted: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      branches,
    });
  } catch (error: any) {
    console.error("Fetch Branches Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch branches" },
      { status: 500 }
    );
  }
}

// POST /api/branches - Create a new branch
export async function POST(req: Request) {
  const auth = await requireRoles(["admin"]);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const {
      code,
      name,
      address,
      city = "Delhi",
      state = "Delhi",
      pincode,
      phone,
      email,
      managerName,
      isActive = true,
      assignedEmployeeIds = [],
    } = body;

    if (!name || !code) {
      return NextResponse.json(
        { success: false, message: "Branch Name and Branch Code are required" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    // Check unique code
    const existing = await prisma.branch.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `Branch Code '${cleanCode}' already exists` },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.create({
      data: {
        code: cleanCode,
        name: name.trim(),
        address: address?.trim() || null,
        city: city?.trim() || "Delhi",
        state: state?.trim() || "Delhi",
        pincode: pincode?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        managerName: managerName?.trim() || null,
        isActive: Boolean(isActive),
      },
    });

    // Assign employees if provided
    if (Array.isArray(assignedEmployeeIds) && assignedEmployeeIds.length > 0) {
      await prisma.employee.updateMany({
        where: { id: { in: assignedEmployeeIds } },
        data: {
          branchId: branch.id,
          branch: branch.name,
        },
      });
    }

    const fullBranch = await prisma.branch.findUnique({
      where: { id: branch.id },
      include: {
        employees: {
          select: {
            id: true,
            employeeCode: true,
            name: true,
            role: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Branch created successfully",
      branch: fullBranch,
    });
  } catch (error: any) {
    console.error("Create Branch Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create branch" },
      { status: 500 }
    );
  }
}
