import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/apiAuth";

// GET /api/branches/[id]
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const branch = await prisma.branch.findUnique({
      where: { id },
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
    });

    if (!branch) {
      return NextResponse.json({ success: false, message: "Branch not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, branch });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT /api/branches/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRoles(["admin"]);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const {
      code,
      name,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      managerName,
      isActive,
      assignedEmployeeIds,
    } = body;

    const existingBranch = await prisma.branch.findUnique({
      where: { id },
    });

    if (!existingBranch) {
      return NextResponse.json({ success: false, message: "Branch not found" }, { status: 404 });
    }

    const cleanCode = code ? code.trim().toUpperCase() : existingBranch.code;

    // Check code collision if code changed
    if (code && cleanCode !== existingBranch.code) {
      const codeCollision = await prisma.branch.findUnique({
        where: { code: cleanCode },
      });
      if (codeCollision) {
        return NextResponse.json(
          { success: false, message: `Branch Code '${cleanCode}' is already used by another branch` },
          { status: 400 }
        );
      }
    }

    const updatedBranch = await prisma.branch.update({
      where: { id },
      data: {
        code: cleanCode,
        name: name !== undefined ? name.trim() : existingBranch.name,
        address: address !== undefined ? (address?.trim() || null) : existingBranch.address,
        city: city !== undefined ? (city?.trim() || "Delhi") : existingBranch.city,
        state: state !== undefined ? (state?.trim() || "Delhi") : existingBranch.state,
        pincode: pincode !== undefined ? (pincode?.trim() || null) : existingBranch.pincode,
        phone: phone !== undefined ? (phone?.trim() || null) : existingBranch.phone,
        email: email !== undefined ? (email?.trim() || null) : existingBranch.email,
        managerName: managerName !== undefined ? (managerName?.trim() || null) : existingBranch.managerName,
        isActive: isActive !== undefined ? Boolean(isActive) : existingBranch.isActive,
      },
    });

    // Handle staff assignments if explicitly provided
    if (Array.isArray(assignedEmployeeIds)) {
      // 1. Unassign employees currently assigned to this branch who are NOT in assignedEmployeeIds
      await prisma.employee.updateMany({
        where: {
          branchId: id,
          id: { notIn: assignedEmployeeIds },
        },
        data: {
          branchId: null,
          branch: "Unassigned",
        },
      });

      // 2. Assign the new employee list to this branch
      if (assignedEmployeeIds.length > 0) {
        await prisma.employee.updateMany({
          where: { id: { in: assignedEmployeeIds } },
          data: {
            branchId: updatedBranch.id,
            branch: updatedBranch.name,
          },
        });
      }
    } else if (name && name.trim() !== existingBranch.name) {
      // If branch name changed, sync string name on assigned employees
      await prisma.employee.updateMany({
        where: { branchId: id },
        data: { branch: name.trim() },
      });
    }

    const fullBranch = await prisma.branch.findUnique({
      where: { id },
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
      message: "Branch updated successfully",
      branch: fullBranch,
    });
  } catch (error: any) {
    console.error("Update Branch Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update branch" },
      { status: 500 }
    );
  }
}

// DELETE /api/branches/[id]
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRoles(["admin"]);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const existingBranch = await prisma.branch.findUnique({
      where: { id },
      include: { employees: true },
    });

    if (!existingBranch) {
      return NextResponse.json({ success: false, message: "Branch not found" }, { status: 404 });
    }

    // Unlink employees
    await prisma.employee.updateMany({
      where: { branchId: id },
      data: { branchId: null, branch: "Unassigned" },
    });

    // Delete branch
    await prisma.branch.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Branch '${existingBranch.name}' deleted and employees unassigned.`,
    });
  } catch (error: any) {
    console.error("Delete Branch Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete branch" },
      { status: 500 }
    );
  }
}
