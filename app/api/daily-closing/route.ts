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
    let today = new Date().toLocaleDateString("en-CA");

    try {
      const body = await req.json();
      if (body.date) {
        today = body.date;
      }
      cashClosingAfterExpenses = Number(body.cashClosingAfterExpenses || 0);
      dailyWageDeductions = Number(body.dailyWageDeductions || 0);
      onlinePaymentCollected = Number(body.onlinePaymentCollected || 0);
    } catch {
      // Empty body allowed
    }

    const bookings = await prisma.booking.findMany({
      where: {
        bookingDate: today,
        status: {
          not: "Cancelled",
        },
      },
    });

    const parts = today.split("-");
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const startDate = new Date(y, m, d, 0, 0, 0, 0);
    const endDate = new Date(y, m, d, 23, 59, 59, 999);

    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalRevenue = bookings.reduce(
      (sum, booking) => sum + (booking.totalCost || 0),
      0
    );

    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + (expense.amount || 0),
      0
    );

    const cashRevenue = bookings
      .filter((booking) => booking.paymentMode === "Cash")
      .reduce((sum, booking) => sum + (booking.totalCost || 0), 0);

    const upiRevenue = bookings
      .filter((booking) => booking.paymentMode === "UPI")
      .reduce((sum, booking) => sum + (booking.totalCost || 0), 0);

    const netProfit = totalRevenue - totalExpenses;

    const closing = await prisma.dailyClosing.upsert({
      where: {
        date: today,
      },
      update: {
        totalRevenue,
        totalExpenses,
        netProfit,
        totalBookings: bookings.length,
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
        totalBookings: bookings.length,
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
