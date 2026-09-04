import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";

// GET /api/expenses/reports - Generate dynamic reports
export async function GET(req: Request) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "monthly"; // monthly | category | vendor | profit-vs-expense | cash-flow
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);

  try {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    if (type === "monthly") {
      const [expenses, payrolls] = await Promise.all([
        prisma.expense.findMany({
          where: { date: { gte: startDate, lte: endDate } },
          select: { date: true, amount: true },
        }),
        prisma.payroll.findMany({
          where: { month: { startsWith: String(year) } },
          select: { month: true, netPayable: true },
        }),
      ]);

      // Group by month
      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(year, i, 1).toLocaleString("default", { month: "short" }),
        amount: 0,
      }));

      expenses.forEach((e) => {
        const m = new Date(e.date).getMonth();
        monthlyData[m].amount += e.amount;
      });

      payrolls.forEach((p) => {
        const parts = p.month.split("-");
        if (parts.length === 2) {
          const m = parseInt(parts[1], 10) - 1;
          if (m >= 0 && m < 12) {
            monthlyData[m].amount += p.netPayable || 0;
          }
        }
      });

      return NextResponse.json({ success: true, report: monthlyData });
    }

    if (type === "category") {
      const [categoryGroup, payrolls] = await Promise.all([
        prisma.expense.groupBy({
          by: ["category"],
          where: { date: { gte: startDate, lte: endDate } },
          _sum: { amount: true },
        }),
        prisma.payroll.aggregate({
          where: { month: { startsWith: String(year) } },
          _sum: { netPayable: true },
        }),
      ]);

      const report = categoryGroup.map((g) => ({
        category: g.category || "Uncategorized",
        amount: g._sum.amount || 0,
      }));

      const totalPayroll = payrolls._sum.netPayable || 0;
      if (totalPayroll > 0) {
        const existingSalaryIdx = report.findIndex(
          (c) => c.category.toUpperCase() === "SALARY" || c.category.toUpperCase() === "WAGES"
        );
        if (existingSalaryIdx !== -1) {
          report[existingSalaryIdx].amount += totalPayroll;
        } else {
          report.push({
            category: "WAGES & SALARIES",
            amount: totalPayroll,
          });
        }
      }

      return NextResponse.json({ success: true, report });
    }

    if (type === "vendor") {
      const vendorGroup = await prisma.expense.groupBy({
        by: ["paidTo"],
        where: {
          date: { gte: startDate, lte: endDate },
          paidTo: { not: null },
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
      });

      const report = vendorGroup.map((g) => ({
        vendor: g.paidTo || "Unknown",
        amount: g._sum.amount || 0,
      }));

      return NextResponse.json({ success: true, report });
    }

    if (type === "cash-flow") {
      // Group expenses by payment mode
      const paymentGroup = await prisma.expense.groupBy({
        by: ["paymentMode"],
        where: { date: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      });

      const report = paymentGroup.map((g) => ({
        paymentMode: g.paymentMode || "Unspecified",
        amount: g._sum.amount || 0,
      }));

      return NextResponse.json({ success: true, report });
    }

    if (type === "profit-vs-expense") {
      // Fetch bookings for the selected year
      const bookings = await prisma.booking.findMany({
        where: {
          bookingDate: {
            startsWith: `${year}-`,
          },
          status: {
            not: "Cancelled",
          },
        },
        select: {
          bookingDate: true,
          totalCost: true,
        },
      });

      // Fetch transactions for the selected year
      const transactions = await prisma.transaction.findMany({
        where: {
          date: {
            startsWith: `${year}-`,
          },
        },
        select: {
          date: true,
          amount: true,
          finalAmount: true,
        },
      });

      // Fetch expenses and payroll for the selected year
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      const [expenses, payrolls] = await Promise.all([
        prisma.expense.findMany({
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            date: true,
            amount: true,
          },
        }),
        prisma.payroll.findMany({
          where: {
            month: {
              startsWith: `${year}-`,
            },
          },
          select: {
            month: true,
            netPayable: true,
          },
        }),
      ]);

      // Map closely to monthly or cumulative overview
      const monthlySummary = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(year, i, 1).toLocaleString("default", { month: "short" }),
        revenue: 0,
        expense: 0,
        profit: 0,
      }));

      // Aggregate bookings (revenue)
      bookings.forEach((b) => {
        const parts = b.bookingDate.split("-");
        if (parts.length === 3) {
          const m = parseInt(parts[1], 10) - 1;
          if (m >= 0 && m < 12) {
            monthlySummary[m].revenue += b.totalCost || 0;
          }
        }
      });

      // Aggregate transactions (revenue)
      transactions.forEach((t) => {
        const parts = t.date.split("-");
        if (parts.length === 3) {
          const m = parseInt(parts[1], 10) - 1;
          if (m >= 0 && m < 12) {
            monthlySummary[m].revenue += t.finalAmount ?? t.amount ?? 0;
          }
        }
      });

      // Aggregate expenses
      expenses.forEach((e) => {
        const m = new Date(e.date).getMonth();
        if (m >= 0 && m < 12) {
          monthlySummary[m].expense += e.amount || 0;
        }
      });

      // Aggregate payroll / salaries
      payrolls.forEach((p) => {
        const parts = p.month.split("-");
        if (parts.length === 2) {
          const m = parseInt(parts[1], 10) - 1;
          if (m >= 0 && m < 12) {
            monthlySummary[m].expense += p.netPayable || 0;
          }
        }
      });

      // Calculate profit
      monthlySummary.forEach((m) => {
        m.profit = m.revenue - m.expense;
      });

      return NextResponse.json({ success: true, report: monthlySummary });
    }

    return NextResponse.json(
      { success: false, message: "Invalid report type specified" },
      { status: 400 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to generate report" },
      { status: 500 }
    );
  }
}
