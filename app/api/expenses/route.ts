import { prisma } from "@/lib/prisma";

import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";

export async function GET() {
  const auth = await requireRoles(["admin", "manager"]);

  if (auth.response) {
    return auth.response;
  }

  const expenses =
    await prisma.expense.findMany({

      orderBy: {
        createdAt: "desc",
      },

    });

  return NextResponse.json({
    expenses,
  });
}

export async function POST(
  req: Request
) {
  const auth = await requireRoles(["admin", "manager"]);

  if (auth.response) {
    return auth.response;
  }

  try {

    const body = await req.json();

    const expense =
      await prisma.expense.create({

        data: {

          title: body.title,

          amount: body.amount,

          category: body.category,

          paymentMode:
            body.paymentMode,

          notes: body.notes,

        },

      });

    return NextResponse.json({
      success: true,
      expense,
    });

  } catch {

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}
