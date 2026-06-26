import { prisma } from "@/lib/prisma";

import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";


export async function GET() {
  const auth = await requireRoles(["admin", "manager"]);

  if (auth.response) {
    return auth.response;
  }

  try {

    const closings =
      await prisma.dailyClosing.findMany({

        orderBy: {
          createdAt: "desc",
        },

      });

    return NextResponse.json({
      closings,
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

export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "manager", "supervisor"]);

  if (auth.response) {
    return auth.response;
  }

  try {
    let cashClosingAfterExpenses = 0;
    let dailyWageDeductions = 0;
    let onlinePaymentCollected = 0;

    try {
      const body = await req.json();
      cashClosingAfterExpenses = Number(body.cashClosingAfterExpenses || 0);
      dailyWageDeductions = Number(body.dailyWageDeductions || 0);
      onlinePaymentCollected = Number(body.onlinePaymentCollected || 0);
    } catch (e) {
      // Empty body allowed
    }

    const today =
      new Date().toISOString().split("T")[0];

    const bookings =
      await prisma.booking.findMany();

    const expenses =
      await prisma.expense.findMany();

    const totalRevenue =
      bookings.reduce(
        (sum, booking) =>
          sum + booking.totalCost,
        0
      );

    const totalExpenses =
      expenses.reduce(
        (sum, expense) =>
          sum + expense.amount,
        0
      );

    const cashRevenue =
      bookings
        .filter(
          (booking) =>
            booking.paymentMode ===
            "Cash"
        )
        .reduce(
          (sum, booking) =>
            sum + booking.totalCost,
          0
        );

    const upiRevenue =
      bookings
        .filter(
          (booking) =>
            booking.paymentMode ===
            "UPI"
        )
        .reduce(
          (sum, booking) =>
            sum + booking.totalCost,
          0
        );

    const netProfit =
      totalRevenue - totalExpenses;

    const closing =
      await prisma.dailyClosing.upsert({

        where: {
          date: today,
        },

        update: {

          totalRevenue,

          totalExpenses,

          netProfit,

          totalBookings:
            bookings.length,

          cashRevenue,

          upiRevenue,

          cashClosingAfterExpenses,
          dailyWageDeductions,
          onlinePaymentCollected,

        },

        create: {

          date: today,

          totalRevenue,

          totalExpenses,

          netProfit,

          totalBookings:
            bookings.length,

          cashRevenue,

          upiRevenue,

          cashClosingAfterExpenses,
          dailyWageDeductions,
          onlinePaymentCollected,

        },

      });

    return NextResponse.json({
      success: true,
      closing,
    });

  } catch (error) {

    console.log(error);

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
