import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const offers = await prisma.offer.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ success: true, offers });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const offer = await prisma.offer.create({
      data: {
        title: body.title,
        description: body.description,
        discountPercent: parseInt(body.discountPercent) || 0,
        discountAmount: parseInt(body.discountAmount) || 0,
        validDays: body.validDays || [],
        startTime: body.startTime,
        endTime: body.endTime,
        applicableServiceIds: body.applicableServiceIds || [],
        minVehicles: parseInt(body.minVehicles) || 1,
        discountSecondVehicleAmount: parseInt(body.discountSecondVehicleAmount) || 0,
        code: body.code,
        isActive: body.isActive ?? true,
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        imageUrl: body.imageUrl, // Base64 string
      }
    });
    return NextResponse.json({ success: true, offer });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
