import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const offer = await prisma.offer.update({
      where: { id },
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
        isActive: body.isActive,
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        imageUrl: body.imageUrl !== undefined ? body.imageUrl : undefined,
      }
    });
    return NextResponse.json({ success: true, offer });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.offer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
