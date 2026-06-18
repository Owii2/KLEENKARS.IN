import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles, getCurrentUser } from "@/lib/apiAuth";
import { calculateCustomerCategories } from "@/lib/customerCategories";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Find or create customer
    let customer = await prisma.customer.findUnique({ where: { phoneNumber: body.phoneNumber } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          customerName: body.customerName,
          phoneNumber: body.phoneNumber,
          // Initial category assignment will happen after first booking
        },
      });
    }

    // Create/update vehicle record
    let vehicle = await prisma.vehicle.findFirst({ where: { customerId: customer.id, plateNumber: body.vehicleNumber } });
    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: {
          customerId: customer.id,
          plateNumber: body.vehicleNumber,
          type: body.vehicleType,
          value: body.vehicleValue, // Assuming vehicleValue is passed in body
        },
      });
    }

    const booking = await prisma.booking.create({
      data: {
        customerName: body.customerName,
        phoneNumber: body.phoneNumber,
        vehicleType: body.vehicleType,
        serviceType: body.serviceType,
        addons: body.addons || [],
        pickupDrop: body.pickupDrop || false,
        bookingDate: body.bookingDate,
        bookingTime: body.bookingTime,
        totalCost: body.totalCost,
        paymentMode: body.paymentMode || "Cash",
        discount: body.discount || 0,
        finalAmount: body.finalAmount || body.totalCost,
        notes: body.notes || "",
        referralCode: body.referralCode || null,
        customerId: customer.id, // Link to customer
        serviceId: body.serviceId, // Link to service
      },
    });

    // Update customer stats after booking
    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        totalVisits: { increment: 1 },
        totalSpent: { increment: body.totalCost },
        lastVisit: new Date(),
        // Update history fields
        visitHistory: {
          push: new Date().toISOString(),
        },
        spendingHistory: {
          push: { date: new Date().toISOString(), amount: body.totalCost },
        },
      },
    });

    // Recalculate customer categories
    await calculateCustomerCategories(customer.id);

    // Handle referral rewards: if booking includes referralCode, credit referrer
    if (body.referralCode) {
      const referrer = await prisma.customer.findFirst({ where: { referralCode: body.referralCode } });
      if (referrer) {
        await prisma.customer.update({ where: { id: referrer.id }, data: { referralPoints: { increment: 50 } } });
        await prisma.booking.update({ where: { id: booking.id }, data: { referralRewarded: true } });
        await prisma.customer.update({ where: { id: customer.id }, data: { referredBy: referrer.phoneNumber } }).catch(() => {}); // Store referrer phone number in referredBy string
      }
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false, message: "Booking failed" }, { status: 500 });
  }
}
