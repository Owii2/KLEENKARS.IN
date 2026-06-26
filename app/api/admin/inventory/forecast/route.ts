import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";

// Define the service keywords matching pattern and their consumption rates per wash
const CONSUMPTION_RULES: Record<string, Record<string, number>> = {
  "Express Wash": {
    "shampoo": 0.15,
    "microfiber": 0.05
  },
  "Classic Wash": {
    "shampoo": 0.20,
    "microfiber": 0.08
  },
  "Premium Wash": {
    "shampoo": 0.25,
    "microfiber": 0.10,
    "tyreShine": 0.05,
    "wax": 0.03,
    "perfume": 1
  },
  "Rainy Day Shine": {
    "shampoo": 0.25,
    "microfiber": 0.10,
    "wax": 0.05
  },
  "Cabin Revive": {
    "cleaner": 0.40,
    "microfiber": 0.15
  },
  "Paint Restoration": {
    "wax": 0.10,
    "microfiber": 0.20
  },
  // Addon Specifics
  "Tyre Shine": {
    "tyreShine": 0.05
  },
  "Body Wax": {
    "wax": 0.05
  },
  "Dashboard Polish": {
    "dashboardPolish": 0.05
  },
  "Hanging Car Perfume": {
    "perfume": 1
  }
};

// Map database inventory item names to keys in our consumption rules
const ITEM_MAP: Record<string, string> = {
  "Wavex Foam Wash Soap": "shampoo",
  "Autofresh Tyre Shine": "tyreShine",
  "3M Paint Polish Wax": "wax",
  "Cabin Revive Upholstery Cleaner": "cleaner",
  "Microfiber Detailing Cloths": "microfiber",
  "Dashboard Polish Spray": "dashboardPolish",
  "Premium Hanging Car Perfume": "perfume"
};

// Auto-seed helper if DB has no items
async function seedDefaultInventory() {
  const defaultItems = [
    { name: "Wavex Foam Wash Soap", quantity: 35, unit: "Liters", minStock: 10, costPerUnit: 120 },
    { name: "Autofresh Tyre Shine", quantity: 6.5, unit: "Liters", minStock: 2, costPerUnit: 350 },
    { name: "3M Paint Polish Wax", quantity: 4.2, unit: "Liters", minStock: 1.5, costPerUnit: 800 },
    { name: "Cabin Revive Upholstery Cleaner", quantity: 8.0, unit: "Liters", minStock: 3, costPerUnit: 240 },
    { name: "Microfiber Detailing Cloths", quantity: 50, unit: "Pieces", minStock: 15, costPerUnit: 60 },
    { name: "Dashboard Polish Spray", quantity: 3.5, unit: "Liters", minStock: 1.0, costPerUnit: 180 },
    { name: "Premium Hanging Car Perfume", quantity: 18, unit: "Pieces", minStock: 5, costPerUnit: 40 }
  ];

  for (const item of defaultItems) {
    await prisma.inventoryItem.upsert({
      where: { name: item.name },
      update: {},
      create: item
    });
  }
}

// Auto-seed helper for bookings to showcase forecasting
async function seedDefaultBookings(services: any[]) {
  if (services.length === 0) return;

  const today = new Date();
  const formatOffsetDate = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offsetDays);
    return d.toISOString().split("T")[0];
  };

  // Find some common services
  const expressBike = services.find(s => s.name.includes("Express Wash - Bike")) || services[0];
  const premiumHatch = services.find(s => s.name.includes("Premium Wash - Hatchback")) || services[0];
  const classicSUV = services.find(s => s.name.includes("Classic Wash - SUV")) || services[0];
  const cabinSUV = services.find(s => s.name.includes("Cabin Revive - SUV")) || services[0];
  const bodyWax = services.find(s => s.name === "Body Wax") || services[0];
  const tyreShine = services.find(s => s.name === "Tyre Shine") || services[0];

  const mockBookings = [
    // Past Bookings (to establish historical baseline)
    { customerName: "Aman Sharma", phoneNumber: "9876543210", bookingDate: formatOffsetDate(-8), totalCost: 49, serviceId: expressBike.id, status: "Completed" },
    { customerName: "Rahul Verma", phoneNumber: "9876543211", bookingDate: formatOffsetDate(-6), totalCost: 299, serviceId: premiumHatch.id, status: "Completed" },
    { customerName: "Vikram Singh", phoneNumber: "9876543212", bookingDate: formatOffsetDate(-5), totalCost: 249, serviceId: classicSUV.id, status: "Completed" },
    { customerName: "Neha Gupta", phoneNumber: "9876543213", bookingDate: formatOffsetDate(-4), totalCost: 1499, serviceId: cabinSUV.id, status: "Completed" },
    { customerName: "Amit Kumar", phoneNumber: "9876543214", bookingDate: formatOffsetDate(-3), totalCost: 100, serviceId: bodyWax.id, status: "Completed" },
    { customerName: "Siddharth", phoneNumber: "9876543215", bookingDate: formatOffsetDate(-2), totalCost: 299, serviceId: premiumHatch.id, status: "Completed" },
    { customerName: "Priya Das", phoneNumber: "9876543216", bookingDate: formatOffsetDate(-1), totalCost: 249, serviceId: classicSUV.id, status: "Completed" },

    // Future Bookings (scheduling trend)
    { customerName: "Zaid Khan", phoneNumber: "9876543217", bookingDate: formatOffsetDate(0), totalCost: 399, serviceId: premiumHatch.id, status: "Pending" },
    { customerName: "Kunal Sen", phoneNumber: "9876543218", bookingDate: formatOffsetDate(1), totalCost: 1499, serviceId: cabinSUV.id, status: "Pending" },
    { customerName: "Rohan Kapoor", phoneNumber: "9876543219", bookingDate: formatOffsetDate(2), totalCost: 249, serviceId: classicSUV.id, status: "Pending" },
    { customerName: "Sneha Roy", phoneNumber: "9876543220", bookingDate: formatOffsetDate(3), totalCost: 49, serviceId: expressBike.id, status: "Pending" },
    { customerName: "Manish Joshi", phoneNumber: "9876543221", bookingDate: formatOffsetDate(4), totalCost: 50, serviceId: tyreShine.id, status: "Pending" },
    { customerName: "Aditya Goel", phoneNumber: "9876543222", bookingDate: formatOffsetDate(5), totalCost: 299, serviceId: premiumHatch.id, status: "Pending" },
    { customerName: "Tanveer", phoneNumber: "9876543223", bookingDate: formatOffsetDate(6), totalCost: 249, serviceId: classicSUV.id, status: "Pending" },
    { customerName: "Ishita", phoneNumber: "9876543224", bookingDate: formatOffsetDate(7), totalCost: 1499, serviceId: cabinSUV.id, status: "Pending" }
  ];

  for (const b of mockBookings) {
    await prisma.booking.create({
      data: {
        customerName: b.customerName,
        phoneNumber: b.phoneNumber,
        bookingDate: b.bookingDate,
        bookingTime: "11:00 AM",
        totalCost: b.totalCost,
        status: b.status,
        pickupDrop: false,
        serviceId: b.serviceId
      }
    });
  }
}

export async function GET() {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    // 1. Fetch available services first
    const services = await prisma.service.findMany({
      where: { isActive: true }
    });

    // 2. Auto-seed if database is empty
    const itemCount = await prisma.inventoryItem.count();
    if (itemCount === 0) {
      await seedDefaultInventory();
    }

    const bookingCount = await prisma.booking.count();
    if (bookingCount === 0) {
      await seedDefaultBookings(services);
    }

    // 3. Fetch all active data
    const [items, bookings] = await Promise.all([
      prisma.inventoryItem.findMany({ orderBy: { name: "asc" } }),
      prisma.booking.findMany({
        include: { service: true }
      })
    ]);

    // Parse booking dates to categorize past (last 30 days) and future (next 14 days)
    const todayStr = new Date().toISOString().split("T")[0];
    const today = new Date(todayStr);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const fourteenDaysAhead = new Date();
    fourteenDaysAhead.setDate(today.getDate() + 14);

    const pastBookings = bookings.filter(b => {
      const bDate = new Date(b.bookingDate);
      return bDate >= thirtyDaysAgo && bDate < today;
    });

    const futureBookings = bookings.filter(b => {
      const bDate = new Date(b.bookingDate);
      return bDate >= today && bDate <= fourteenDaysAhead;
    });

    // Helper to estimate inventory consumption for a list of bookings
    const calculateConsumption = (bookingList: any[]) => {
      const usage: Record<string, number> = {
        shampoo: 0,
        tyreShine: 0,
        wax: 0,
        cleaner: 0,
        microfiber: 0,
        dashboardPolish: 0,
        perfume: 0
      };

      for (const b of bookingList) {
        const serviceName = b.service?.name || "";
        if (!serviceName) continue;

        // Check each keyword rule
        for (const [kw, rates] of Object.entries(CONSUMPTION_RULES)) {
          if (serviceName.toLowerCase().includes(kw.toLowerCase())) {
            for (const [itemKey, amt] of Object.entries(rates)) {
              usage[itemKey] += amt;
            }
          }
        }
      }

      return usage;
    };

    const pastUsage = calculateConsumption(pastBookings);
    const futureUsage = calculateConsumption(futureBookings);

    // Compute forecasts for each inventory item
    const forecasts = items.map(item => {
      const mappedKey = ITEM_MAP[item.name];
      
      // Calculate daily rates
      const pastTotal = mappedKey ? (pastUsage[mappedKey] || 0) : 0;
      const futureTotal = mappedKey ? (futureUsage[mappedKey] || 0) : 0;

      const dailyPastRate = pastTotal / 30;
      const dailyFutureRate = futureTotal / 14;

      // Use the higher rate of the two (scheduled booking peak or historical average)
      // If both are 0, default to 0
      let dailyUsageRate = Math.max(dailyPastRate, dailyFutureRate);

      // Clean up usage rate decimal
      dailyUsageRate = Math.round(dailyUsageRate * 1000) / 1000;

      let daysLeft = Infinity;
      let status = "SAFE";
      let suggestedReorderDate = "N/A";

      if (dailyUsageRate > 0) {
        daysLeft = Math.round((item.quantity / dailyUsageRate) * 10) / 10;
        
        const reorderDate = new Date();
        reorderDate.setDate(today.getDate() + Math.floor(daysLeft));
        suggestedReorderDate = reorderDate.toISOString().split("T")[0];

        if (daysLeft <= 3) {
          status = "CRITICAL";
        } else if (daysLeft <= 7 || item.quantity < item.minStock) {
          status = "WARNING";
        }
      } else if (item.quantity < item.minStock) {
        status = "WARNING";
      }

      return {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        minStock: item.minStock,
        costPerUnit: item.costPerUnit,
        dailyUsageRate,
        daysLeft: daysLeft === Infinity ? "Infinity" : daysLeft,
        status,
        suggestedReorderDate,
        pastCountUsed: Math.round(pastTotal * 100) / 100,
        futureCountUsed: Math.round(futureTotal * 100) / 100
      };
    });

    return NextResponse.json({
      success: true,
      forecasts,
      meta: {
        totalBookings: bookings.length,
        pastBaselineBookings: pastBookings.length,
        futureScheduledBookings: futureBookings.length
      }
    });
  } catch (error) {
    console.error("Forecasting API Error:", error);
    return NextResponse.json({ success: false, message: "Failed to generate forecasting analytics" }, { status: 500 });
  }
}
