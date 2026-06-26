import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";

// GET /api/expenses/[id] - Get details of a single expense
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(["admin", "manager", "supervisor"]);
  if (auth.response) {
    return auth.response;
  }

  const { id } = await params;

  try {
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        attachments: true,
        employee: {
          select: {
            name: true,
            employeeCode: true,
          },
        },
      },
    });

    if (!expense) {
      return NextResponse.json(
        { success: false, message: "Expense not found" },
        { status: 404 }
      );
    }

    // Detailer (staff) role restriction
    if (auth.user?.role === "staff" && expense.employeeId !== auth.user.id) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      expense,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch expense details" },
      { status: 500 }
    );
  }
}

// PUT /api/expenses/[id] - Update an expense (Admin, Manager only)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) {
    return auth.response;
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const {
      date,
      amount,
      category,
      description,
      paidTo,
      paymentMode,
      invoiceNumber,
      vendorGSTNumber,
      receiptUrl,
      notes,
      employeeId,
      branch,
      project,
      costCenter,
      attachments, // Array of { id?, url, mimeType, action: 'add' | 'delete' }
    } = body;

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      return NextResponse.json(
        { success: false, message: "Expense not found" },
        { status: 404 }
      );
    }

    // Transaction to update expense and handle attachments
    const updatedExpense = await prisma.$transaction(async (tx) => {
      // 1. Process attachments modifications if specified
      if (attachments && Array.isArray(attachments)) {
        for (const att of attachments) {
          if (att.action === "delete" && att.id) {
            await tx.attachment.delete({
              where: { id: att.id },
            });
          } else if (att.action === "add" && att.url) {
            await tx.attachment.create({
              data: {
                expenseId: id,
                url: att.url,
                mimeType: att.mimeType || "application/octet-stream",
              },
            });
          }
        }
      }

      // 2. Update core expense attributes
      return tx.expense.update({
        where: { id },
        data: {
          date: date ? new Date(date) : undefined,
          amount: amount !== undefined ? parseInt(amount, 10) : undefined,
          category: category !== undefined ? (category || null) : undefined,
          description: description !== undefined ? (description || null) : undefined,
          paidTo: paidTo !== undefined ? (paidTo || null) : undefined,
          paymentMode: paymentMode !== undefined ? (paymentMode || null) : undefined,
          invoiceNumber: invoiceNumber !== undefined ? (invoiceNumber || null) : undefined,
          vendorGSTNumber: vendorGSTNumber !== undefined ? (vendorGSTNumber || null) : undefined,
          receiptUrl: receiptUrl !== undefined ? (receiptUrl || null) : undefined,
          notes: notes !== undefined ? (notes || null) : undefined,
          employeeId: employeeId !== undefined ? (employeeId || null) : undefined,
          branch: branch !== undefined ? (branch || null) : undefined,
          project: project !== undefined ? (project || null) : undefined,
          costCenter: costCenter !== undefined ? (costCenter || null) : undefined,
          updatedBy: auth.user?.name || "System",
        },
        include: {
          attachments: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      expense: updatedExpense,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to update expense" },
      { status: 500 }
    );
  }
}

// DELETE /api/expenses/[id] - Delete an expense (Admin only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(["admin"]);
  if (auth.response) {
    return auth.response;
  }

  const { id } = await params;

  try {
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      return NextResponse.json(
        { success: false, message: "Expense not found" },
        { status: 404 }
      );
    }

    // Cascade delete attachments first
    await prisma.$transaction([
      prisma.attachment.deleteMany({
        where: { expenseId: id },
      }),
      prisma.expense.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Expense and attachments deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
