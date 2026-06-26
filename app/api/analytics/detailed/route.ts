import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const weekdayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const timeBuckets = [
  { name: "Night", check: (h: number) => h < 6 },
  { name: "Morning", check: (h: number) => h >= 6 && h < 12 },
  { name: "Afternoon", check: (h: number) => h >= 12 && h < 18 },
  { name: "Evening", check: (h: number) => h >= 18 },
];

export async function GET() {
  try {
    const [bookings, transactions, events, weather] = await Promise.all([
      prisma.booking.findMany({
        select: { createdAt: true, totalCost: true, bookingDate: true, bookingTime: true },
      }),
      prisma.transaction.findMany({
        select: { createdAt: true, amount: true, finalAmount: true, date: true, time: true },
      }),
      prisma.event.findMany({ select: { date: true, type: true, description: true } }),
      prisma.weatherLog.findMany({ select: { date: true, temperature: true, condition: true } }),
    ]);

    const eventMap = new Map(events.map(e => [e.date.toISOString().slice(0,10), e]));
    const weatherMap = new Map(weather.map(w => [w.date.toISOString().slice(0,10), w]));

    const agg: Record<string, { bookings: number; revenue: number }> = {};

    for (const b of bookings) {
      const dateObj = b.createdAt
        ? new Date(b.createdAt)
        : b.bookingDate && b.bookingTime
        ? new Date(`${b.bookingDate} ${b.bookingTime}`)
        : null;
      if (!dateObj) continue;
      const day = weekdayNames[dateObj.getUTCDay()];
      const hour = dateObj.getUTCHours();
      const bucket = timeBuckets.find(bucket => bucket.check(hour))?.name || "Unknown";
      const key = `${day}|${bucket}`;
      if (!agg[key]) agg[key] = { bookings: 0, revenue: 0 };
      agg[key].bookings += 1;
      agg[key].revenue += b.totalCost ?? 0;
    }

    for (const t of transactions) {
      const dateObj = t.createdAt
        ? new Date(t.createdAt)
        : t.date && t.time
        ? new Date(`${t.date} ${t.time}`)
        : t.date
        ? new Date(t.date)
        : null;
      if (!dateObj) continue;
      const day = weekdayNames[dateObj.getUTCDay()];
      const hour = dateObj.getUTCHours();
      const bucket = timeBuckets.find(bucket => bucket.check(hour))?.name || "Unknown";
      const key = `${day}|${bucket}`;
      if (!agg[key]) agg[key] = { bookings: 0, revenue: 0 };
      agg[key].bookings += 1;
      agg[key].revenue += t.finalAmount ?? t.amount ?? 0;
    }

    const orderedWeek = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
    const data = [];
    for (const day of orderedWeek) {
      for (const bucket of timeBuckets) {
        const key = `${day}|${bucket.name}`;
        const stats = agg[key] || { bookings: 0, revenue: 0 };
        const todayStr = new Date().toISOString().slice(0,10);
        const evt = eventMap.get(todayStr) || null;
        const wthr = weatherMap.get(todayStr) || null;
        data.push({
          day,
          timeOfDay: bucket.name,
          bookings: stats.bookings,
          revenue: stats.revenue,
          avgRevenue: stats.bookings ? Math.round(stats.revenue / stats.bookings) : 0,
          event: evt ? { type: evt.type, description: evt.description } : null,
          weather: wthr ? { temperature: wthr.temperature, condition: wthr.condition } : null,
        });
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Analytics error" }, { status: 500 });
  }
}
