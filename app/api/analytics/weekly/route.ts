import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const orderedWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const day = now.getDay();

    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const startOfWeek = new Date(year, month, date + diffToMonday, 0, 0, 0, 0);
    const startOfWeekStr = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, "0")}-${String(startOfWeek.getDate()).padStart(2, "0")}`;
    const currentMonthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

    const transactions = await prisma.transaction.findMany({
      select: { amount: true, finalAmount: true, date: true, createdAt: true },
    });

    const agg: Record<string, { count: number; revenue: number }> = {};
    for (const d of orderedWeek) {
      agg[d] = { count: 0, revenue: 0 };
    }

    for (const t of transactions) {
      const dateStr = t.date || (t.createdAt ? t.createdAt.toISOString().split("T")[0] : "");
      if (!dateStr) continue;

      if (filter === "month" && !dateStr.startsWith(currentMonthKey)) continue;
      if (filter === "week" && dateStr < startOfWeekStr) continue;

      // Extract day of week
      const parts = dateStr.split("-");
      if (parts.length >= 3) {
        const dObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const wdName = weekdayNames[dObj.getDay()];
        if (agg[wdName]) {
          agg[wdName].count += 1;
          agg[wdName].revenue += t.finalAmount ?? t.amount ?? 0;
        }
      }
    }

    const data = orderedWeek.map((dayName) => ({
      day: dayName,
      bookings: agg[dayName]?.count ?? 0,
      revenue: agg[dayName]?.revenue ?? 0,
    }));

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Weekly Analytics Error:", err);
    return NextResponse.json({ success: false, message: "Failed to compute analytics" }, { status: 500 });
  }
}
