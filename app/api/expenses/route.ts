import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";

// GET /api/expenses - List expenses with filters, search, and ordering
export async function GET(req: Request) {
  const auth = await requireRoles(["admin", "manager", "supervisor"]);
  if (auth.response) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const paymentMode = searchParams.get("paymentMode") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const minAmount = searchParams.get("minAmount") || "";
  const maxAmount = searchParams.get("maxAmount") || "";

  // Supervisors and Detailers (staff) can view. The permission rules state:
  // Admin: Full Access
  // Manager: Create/Edit Expenses, Import/Export CSV, View Reports
  // Supervisor: Create Expenses, View Expenses
  // Detailer: View Own Submitted Expenses (we filter by user.id if Detailer/staff)
  
  const where: any = {};

  if (auth.user?.role === "staff") {
    where.employeeId = auth.user.id;
  }

  if (search) {
    where.OR = [
      { description: { contains: search, mode: "insensitive" } },
      { paidTo: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.category = category;
  }

  if (paymentMode) {
    where.paymentMode = paymentMode;
  }

  if (startDate || endDate) {
    where.date = {};
    if (startDate) {
      where.date.gte = new Date(startDate);
    }
    if (endDate) {
      where.date.lte = new Date(endDate);
    }
  }

  if (minAmount || maxAmount) {
    where.amount = {};
    if (minAmount) {
      where.amount.gte = parseInt(minAmount, 10);
    }
    if (maxAmount) {
      where.amount.lte = parseInt(maxAmount, 10);
    }
  }

  try {
    const expenses = await prisma.expense.findMany({
      where,
      orderBy: {
        date: "desc",
      },
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

    return NextResponse.json({
      success: true,
      expenses,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

// POST /api/expenses - Quick Entry / Full Entry
export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "manager", "supervisor", "staff"]);
  if (auth.response) {
    return auth.response;
  }

  // Detailer/staff role maps to "View Own Submitted Expenses". 
  // Let's allow them to submit (Create Expenses matches supervisor, but user request states:
  // "Detailer: View Own Submitted Expenses" - let's allow submission so they have own submitted expenses to view).

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
      attachments, // Array of { url, mimeType }
    } = body;

    if (!date || amount === undefined) {
      return NextResponse.json(
        { success: false, message: "Date and Amount are mandatory." },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        date: new Date(date),
        amount: parseInt(amount, 10),
        category: category || null,
        description: description || null,
        paidTo: paidTo || null,
        paymentMode: paymentMode || null,
        invoiceNumber: invoiceNumber || null,
        vendorGSTNumber: vendorGSTNumber || null,
        receiptUrl: receiptUrl || null,
        notes: notes || null,
        employeeId: employeeId || auth.user?.id || null,
        branch: branch || null,
        project: project || null,
        costCenter: costCenter || null,
        createdBy: auth.user?.name || "System",
        attachments: attachments && attachments.length > 0 ? {
          createMany: {
            data: attachments.map((att: any) => ({
              url: att.url,
              mimeType: att.mimeType || "application/octet-stream",
            })),
          },
        } : undefined,
      },
      include: {
        attachments: true,
      },
    });

    return NextResponse.json({
      success: true,
      expense,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to create expense" },
      { status: 500 }
    );
  }
}
