import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";

// GET /api/expenses/categories - Get categories list
export async function GET(req: Request) {
  const auth = await requireRoles(["admin", "manager", "supervisor", "staff"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const categories = await prisma.expenseCategory.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST /api/expenses/categories - Create Category (Admin only)
export async function POST(req: Request) {
  const auth = await requireRoles(["admin"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { name } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Category name is required" },
        { status: 400 }
      );
    }

    const category = await prisma.expenseCategory.create({
      data: { name: name.trim() },
    });

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, message: "Category already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Failed to create category" },
      { status: 500 }
    );
  }
}
