import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";

export async function GET() {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const refunds = await prisma.refund.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, refunds });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to fetch refunds" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { bookingId, amount, reason, paymentMode } = body;

    if (!bookingId || amount === undefined || !reason) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true },
    });

    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });
    }

    if (Number(amount) > booking.totalCost) {
      return NextResponse.json({ success: false, message: "Refund amount cannot exceed booking cost" }, { status: 400 });
    }

    // Create refund record
    const refund = await prisma.refund.create({
      data: {
        bookingId,
        bookingRef: booking.id.substring(0, 8).toUpperCase(),
        customerName: booking.customerName,
        amount: Number(amount),
        reason,
        paymentMode: paymentMode || "UPI",
        status: "Processed",
      },
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "Cancelled" },
    });

    // Subtract from customer's spending history and totalSpent
    if (booking.customer) {
      const currentSpent = booking.customer.totalSpent || 0;
      const newSpent = Math.max(currentSpent - Number(amount), 0);

      await prisma.customer.update({
        where: { id: booking.customer.id },
        data: {
          totalSpent: newSpent,
        },
      });
    }

    return NextResponse.json({ success: true, refund });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to process refund" }, { status: 500 });
  }
}
