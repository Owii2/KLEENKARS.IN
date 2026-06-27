import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const timeBuckets = [
  { name: "Night", check: (h: number) => h < 6 },
  { name: "Morning", check: (h: number) => h >= 6 && h < 12 },
  { name: "Afternoon", check: (h: number) => h >= 12 && h < 18 },
  { name: "Evening", check: (h: number) => h >= 18 },
];

function mapWeatherCode(code: number): string {
  if (code === 0) return "Clear";
  if (code >= 1 && code <= 3) return "Cloudy";
  if (code === 45 || code === 48) return "Foggy";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rainy";
  if (code >= 80 && code <= 82) return "Rain Showers";
  if (code === 95 || code >= 96) return "Thunderstorm";
  return "Clear";
}

async function fetchWithTimeout(url: string, options: any = {}, timeoutMs = 2000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function syncOnlineData(weekDates: string[]) {
  const today = new Date();
  const currentYear = today.getFullYear();

  // 1. Sync public holidays (Events) for the current year if not already cached
  try {
    const holidaysCount = await prisma.event.count({
      where: {
        date: {
          gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
          lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
        },
      },
    });

    if (holidaysCount === 0) {
      console.log(`Syncing public holidays for year ${currentYear} from online API...`);
      const holidaysRes = await fetchWithTimeout(`https://date.nager.at/api/v3/PublicHolidays/${currentYear}/IN`);
      if (holidaysRes.ok) {
        const holidays = await holidaysRes.json();
        for (const holiday of holidays) {
          const dateStr = holiday.date; // YYYY-MM-DD
          await prisma.event.upsert({
            where: { date: new Date(dateStr + "T00:00:00.000Z") },
            update: {
              type: "holiday",
              description: holiday.name,
            },
            create: {
              date: new Date(dateStr + "T00:00:00.000Z"),
              type: "holiday",
              description: holiday.name,
            },
          });
        }
      }
    }
  } catch (e) {
    console.error("Failed to fetch public holidays online:", e);
  }

  // 2. Sync weather logs for the current week if not already cached
  try {
    const weatherCount = await prisma.weatherLog.count({
      where: {
        date: {
          gte: new Date(weekDates[0] + "T00:00:00.000Z"),
          lte: new Date(weekDates[6] + "T23:59:59.999Z"),
        },
      },
    });

    if (weatherCount < 7) {
      console.log(`Syncing weather for current week (${weekDates[0]} to ${weekDates[6]}) from online API...`);
      const startDate = weekDates[0];
      const endDate = weekDates[6];
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=28.6139&longitude=77.2090&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Asia/Kolkata&start_date=${startDate}&end_date=${endDate}`;
      
      const weatherRes = await fetchWithTimeout(weatherUrl);
      if (weatherRes.ok) {
        const weatherData = await weatherRes.json();
        const daily = weatherData.daily;
        if (daily && daily.time) {
          for (let i = 0; i < daily.time.length; i++) {
            const dateStr = daily.time[i];
            const maxTemp = daily.temperature_2m_max[i] ?? 30;
            const minTemp = daily.temperature_2m_min[i] ?? 20;
            const avgTemp = Math.round(((maxTemp + minTemp) / 2) * 10) / 10;
            const wCode = daily.weathercode[i] ?? 0;
            const condition = mapWeatherCode(wCode);

            await prisma.weatherLog.upsert({
              where: { date: new Date(dateStr + "T00:00:00.000Z") },
              update: {
                temperature: avgTemp,
                condition,
              },
              create: {
                date: new Date(dateStr + "T00:00:00.000Z"),
                temperature: avgTemp,
                condition,
              },
            });
          }
        }
      }
    }
  } catch (e) {
    console.error("Failed to fetch weather forecast online:", e);
  }
}

export async function GET() {
  try {
    // Generate dates corresponding to Monday-Sunday of the current week
    const orderedWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1-6
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    const weekDates: string[] = [];
    const dateByDayName: Record<string, string> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      weekDates.push(dateStr);
      dateByDayName[orderedWeek[i]] = dateStr;
    }

    // Attempt online sync in the background/parallel
    await syncOnlineData(weekDates);

    // Fetch data from database
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

    const eventMap = new Map(events.map(e => [e.date.toISOString().slice(0, 10), e]));
    const weatherMap = new Map(weather.map(w => [w.date.toISOString().slice(0, 10), w]));

    const agg: Record<string, { bookings: number; revenue: number }> = {};

    // 1. Process Bookings
    for (const b of bookings) {
      let yr = 2026, mo = 6, dy = 27;
      let hasValidDate = false;
      if (b.bookingDate) {
        const parts = b.bookingDate.split("-");
        if (parts.length === 3) {
          yr = parseInt(parts[0]);
          mo = parseInt(parts[1]);
          dy = parseInt(parts[2]);
          hasValidDate = true;
        }
      }

      let dateObj: Date;
      if (hasValidDate) {
        dateObj = new Date(Date.UTC(yr, mo - 1, dy));
      } else if (b.createdAt) {
        dateObj = new Date(b.createdAt);
      } else {
        continue;
      }

      const day = weekdayNames[dateObj.getUTCDay()];

      let hour = 12; // default
      let hasValidTime = false;
      if (b.bookingTime) {
        const match = b.bookingTime.match(/(\d+):(\d+)(?:\s*(AM|PM))?/i);
        if (match) {
          hour = parseInt(match[1]);
          const amp = match[3];
          if (amp) {
            if (amp.toUpperCase() === "PM" && hour < 12) hour += 12;
            if (amp.toUpperCase() === "AM" && hour === 12) hour = 0;
          }
          hasValidTime = true;
        }
      }

      if (!hasValidTime && b.createdAt) {
        hour = new Date(b.createdAt).getUTCHours();
      }

      const bucket = timeBuckets.find(bucket => bucket.check(hour))?.name || "Unknown";
      const key = `${day}|${bucket}`;
      if (!agg[key]) agg[key] = { bookings: 0, revenue: 0 };
      agg[key].bookings += 1;
      agg[key].revenue += b.totalCost ?? 0;
    }

    // 2. Process Transactions
    for (const t of transactions) {
      let yr = 2026, mo = 6, dy = 27;
      let hasValidDate = false;
      if (t.date) {
        const parts = t.date.split("-");
        if (parts.length === 3) {
          yr = parseInt(parts[0]);
          mo = parseInt(parts[1]);
          dy = parseInt(parts[2]);
          hasValidDate = true;
        }
      }

      let dateObj: Date;
      if (hasValidDate) {
        dateObj = new Date(Date.UTC(yr, mo - 1, dy));
      } else if (t.createdAt) {
        dateObj = new Date(t.createdAt);
      } else {
        continue;
      }

      const day = weekdayNames[dateObj.getUTCDay()];

      let hour = 12; // default
      let hasValidTime = false;
      if (t.time) {
        const match = t.time.match(/(\d+):(\d+)(?:\s*(AM|PM))?/i);
        if (match) {
          hour = parseInt(match[1]);
          const amp = match[3];
          if (amp) {
            if (amp.toUpperCase() === "PM" && hour < 12) hour += 12;
            if (amp.toUpperCase() === "AM" && hour === 12) hour = 0;
          }
          hasValidTime = true;
        }
      }

      if (!hasValidTime && t.createdAt) {
        hour = new Date(t.createdAt).getUTCHours();
      }

      const bucket = timeBuckets.find(bucket => bucket.check(hour))?.name || "Unknown";
      const key = `${day}|${bucket}`;
      if (!agg[key]) agg[key] = { bookings: 0, revenue: 0 };
      agg[key].bookings += 1;
      agg[key].revenue += t.finalAmount ?? t.amount ?? 0;
    }

    // 3. Populate return data structure mapped to specific days of the current week
    const data = [];
    for (const day of orderedWeek) {
      const rowDateStr = dateByDayName[day];
      for (const bucket of timeBuckets) {
        const key = `${day}|${bucket.name}`;
        const stats = agg[key] || { bookings: 0, revenue: 0 };
        const evt = eventMap.get(rowDateStr) || null;
        const wthr = weatherMap.get(rowDateStr) || null;
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
    console.error("Detailed analytics error:", err);
    return NextResponse.json({ success: false, message: "Analytics error" }, { status: 500 });
  }
}
