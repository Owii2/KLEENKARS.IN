import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";
import { generateNextCustomerId } from "@/lib/auth";

export async function GET() {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const [dbCustomers, transactions] = await Promise.all([
      prisma.customer.findMany({
        orderBy: { totalSpent: "desc" },
      }),
      prisma.transaction.findMany({
        select: {
          customerName: true,
          customerMobile: true,
          amount: true,
          finalAmount: true,
          vehicleNumber: true,
          vehicleType: true,
          date: true,
          createdAt: true,
        },
      }),
    ]);

    const customerMap = new Map<string, any>();

    // Add existing DB customers
    for (const c of dbCustomers) {
      const name = c.customerName || "Customer";
      const key = c.phoneNumber ? c.phoneNumber.trim() : name.toLowerCase().trim();
      customerMap.set(key, {
        id: c.id,
        customerName: name,
        phoneNumber: c.phoneNumber || "",
        totalVisits: c.totalVisits || 1,
        totalSpent: c.totalSpent || 0,
        category: (c.totalSpent || 0) >= 5000 ? "VIP Elite" : (c.totalSpent || 0) >= 1500 ? "Regular" : "Standard",
        lastVisit: c.lastVisit ? c.lastVisit.toISOString().split("T")[0] : undefined,
      });
    }

    // Merge in transactions
    let autoIdCounter = dbCustomers.length + 1;
    for (const t of transactions) {
      if (!t.customerName && !t.customerMobile) continue;
      const phone = (t.customerMobile || "").trim();
      const name = (t.customerName || "Customer").trim();
      const key = phone ? phone : name.toLowerCase();

      const amt = t.finalAmount ?? t.amount ?? 0;
      const visitDate = t.date || (t.createdAt ? t.createdAt.toISOString().split("T")[0] : "");

      if (customerMap.has(key)) {
        const existing = customerMap.get(key);
        existing.totalVisits += 1;
        existing.totalSpent += amt;
        existing.category = existing.totalSpent >= 5000 ? "VIP Elite" : existing.totalSpent >= 1500 ? "Regular" : "Standard";
        if (visitDate && (!existing.lastVisit || visitDate > existing.lastVisit)) {
          existing.lastVisit = visitDate;
        }
      } else {
        const cid = `KKC-${String(autoIdCounter++).padStart(4, "0")}`;
        customerMap.set(key, {
          id: cid,
          customerName: name,
          phoneNumber: phone || "N/A",
          totalVisits: 1,
          totalSpent: amt,
          category: amt >= 5000 ? "VIP Elite" : amt >= 1500 ? "Regular" : "Standard",
          lastVisit: visitDate,
        });
      }
    }

    const mergedCustomers = Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);

    return NextResponse.json({
      success: true,
      customers: mergedCustomers,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const existingCustomer = await prisma.customer.findUnique({
      where: { phoneNumber: body.phoneNumber },
    });

    if (existingCustomer) {
      const updatedCustomer = await prisma.customer.update({
        where: { phoneNumber: body.phoneNumber },
        data: {
          totalVisits: { increment: 1 },
          totalSpent: { increment: body.totalSpent || 0 },
          lastVisit: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        customer: updatedCustomer,
      });
    }

    const nextId = await generateNextCustomerId();
    const customer = await prisma.customer.create({
      data: {
        id: nextId,
        customerName: body.customerName,
        phoneNumber: body.phoneNumber,
        totalVisits: 1,
        totalSpent: body.totalSpent || 0,
        lastVisit: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Failed to save customer" }, { status: 500 });
  }
}
