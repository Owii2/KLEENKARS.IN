import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to get weekday name
const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getWeekdayName = (createdAt: Date | null, dateStr: string | null, timeStr: string | null) => {
  if (dateStr) {
    const parts = dateStr.split("-");
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parts[2] ? parseInt(parts[2], 10) : 1;
      const d = new Date(year, month, day);
      return weekdayNames[d.getDay()];
    }
  }
  if (createdAt) {
    const d = new Date(createdAt);
    return weekdayNames[d.getDay()];
  }
  return null;
};

export async function GET() {
  try {
    const [bookings, transactions] = await Promise.all([
      prisma.booking.findMany({
        select: { createdAt: true, totalCost: true, bookingDate: true, bookingTime: true },
      }),
      prisma.transaction.findMany({
        select: { createdAt: true, amount: true, finalAmount: true, date: true, time: true },
      })
    ]);

    // Aggregate by weekday
    const agg: Record<string, { count: number; revenue: number }> = {};
    
    for (const b of bookings) {
      const wd = getWeekdayName(b.createdAt, b.bookingDate, b.bookingTime);
      if (!wd) continue;
      if (!agg[wd]) agg[wd] = { count: 0, revenue: 0 };
      agg[wd].count += 1;
      agg[wd].revenue += b.totalCost ?? 0;
    }

    for (const t of transactions) {
      const wd = getWeekdayName(t.createdAt, t.date, t.time);
      if (!wd) continue;
      if (!agg[wd]) agg[wd] = { count: 0, revenue: 0 };
      agg[wd].count += 1;
      agg[wd].revenue += t.finalAmount ?? t.amount ?? 0;
    }

    // Convert to sorted array (Monday first)
    const orderedWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const data = orderedWeek.map((day) => ({
      day,
      bookings: agg[day]?.count ?? 0,
      revenue: agg[day]?.revenue ?? 0,
    }));

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: 'Failed to compute analytics' }, { status: 500 });
  }
}
