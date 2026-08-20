import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";

// GET /api/expenses/dashboard - Dashboard aggregations and trends
export async function GET(req: Request) {
  const auth = await requireRoles(["admin", "manager", "supervisor"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Total Expenses Today
    const todaySum = await prisma.expense.aggregate({
      where: {
        date: { gte: todayStart },
      },
      _sum: { amount: true },
    });

    // 2. Total Expenses This Month
    const monthSum = await prisma.expense.aggregate({
      where: {
        date: { gte: monthStart },
      },
      _sum: { amount: true },
    });

    // 3. Cash & UPI totals this month
    const cashSum = await prisma.expense.aggregate({
      where: {
        date: { gte: monthStart },
        paymentMode: { equals: "Cash", mode: "insensitive" },
      },
      _sum: { amount: true },
    });

    const upiSum = await prisma.expense.aggregate({
      where: {
        date: { gte: monthStart },
        paymentMode: { equals: "UPI", mode: "insensitive" },
      },
      _sum: { amount: true },
    });

    // 4. Expenses by Category (this month)
    const categoryGroup = await prisma.expense.groupBy({
      by: ["category"],
      where: {
        date: { gte: monthStart },
      },
      _sum: { amount: true },
    });

    // 4b. Fetch Wages / Payroll for this month
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const payrollThisMonth = await prisma.payroll.aggregate({
      where: { month: currentMonthKey },
      _sum: { netPayable: true },
    });
    const monthlyWages = payrollThisMonth._sum.netPayable || 0;

    // Combine categories
    const categoriesCombined = categoryGroup.map((g) => ({
      category: g.category || "Uncategorized",
      amount: g._sum.amount || 0,
    }));

    if (monthlyWages > 0) {
      const existingSalaryIdx = categoriesCombined.findIndex(
        (c) => c.category.toUpperCase() === "SALARY" || c.category.toUpperCase() === "WAGES"
      );
      if (existingSalaryIdx !== -1) {
        categoriesCombined[existingSalaryIdx].amount += monthlyWages;
      } else {
        categoriesCombined.push({
          category: "WAGES & SALARY",
          amount: monthlyWages,
        });
      }
    }

    // 5. Payment Mode breakdown (this month)
    const modeGroup = await prisma.expense.groupBy({
      by: ["paymentMode"],
      where: {
        date: { gte: monthStart },
      },
      _sum: { amount: true },
    });

    // 6. Top Vendors (paidTo)
    const topVendors = await prisma.expense.groupBy({
      by: ["paidTo"],
      where: {
        paidTo: { not: null },
      },
      _sum: { amount: true },
      orderBy: {
        _sum: { amount: "desc" },
      },
      take: 5,
    });

    // 7. Monthly Expense Trend (last 6 months including wages)
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      const [sum, payrollSum] = await Promise.all([
        prisma.expense.aggregate({
          where: { date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
        prisma.payroll.aggregate({
          where: { month: monthKey },
          _sum: { netPayable: true },
        }),
      ]);

      const directAmount = sum._sum.amount || 0;
      const payrollAmount = payrollSum._sum.netPayable || 0;
      const monthName = d.toLocaleString("default", { month: "short" });

      trendData.push({
        month: monthName,
        year: d.getFullYear(),
        amount: directAmount + payrollAmount,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        totalToday: todaySum._sum.amount || 0,
        totalThisMonth: (monthSum._sum.amount || 0) + monthlyWages,
        cashExpensesThisMonth: cashSum._sum.amount || 0,
        upiExpensesThisMonth: upiSum._sum.amount || 0,
        byCategory: categoriesCombined,
        byPaymentMode: modeGroup.map((g) => ({
          paymentMode: g.paymentMode || "Unspecified",
          amount: g._sum.amount || 0,
        })),
        topVendors: topVendors.map((v) => ({
          vendor: v.paidTo || "Unknown",
          amount: v._sum.amount || 0,
        })),
        trend: trendData,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
