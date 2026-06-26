import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await params;
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, message: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch transaction" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const {
      date,
      amount,
      paymentMode,
      time,
      customerName,
      customerMobile,
      customerId,
      vehicleNumber,
      vehicleType,
      serviceOpted,
      addonServices,
      assignedEmployee,
      discountAmount,
      notes,
    } = body;

    // Optional validation check if passed
    if (date === "") {
      return NextResponse.json(
        { success: false, message: "Date cannot be empty" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (date !== undefined) updateData.date = date;
    if (amount !== undefined) {
      updateData.amount = parseInt(amount, 10);
    }
    if (paymentMode !== undefined) updateData.paymentMode = paymentMode;
    if (time !== undefined) updateData.time = time || null;
    if (customerName !== undefined) updateData.customerName = customerName || null;
    if (customerMobile !== undefined) updateData.customerMobile = customerMobile || null;
    if (customerId !== undefined) updateData.customerId = customerId || null;
    if (vehicleNumber !== undefined) updateData.vehicleNumber = vehicleNumber || null;
    if (vehicleType !== undefined) updateData.vehicleType = vehicleType || null;
    if (serviceOpted !== undefined) updateData.serviceOpted = serviceOpted || null;
    if (addonServices !== undefined) updateData.addonServices = addonServices || null;
    if (assignedEmployee !== undefined) updateData.assignedEmployee = assignedEmployee || null;
    if (discountAmount !== undefined) {
      updateData.discountAmount = discountAmount ? parseInt(discountAmount, 10) : 0;
    }
    if (notes !== undefined) updateData.notes = notes || null;

    // Recalculate finalAmount if amount or discountAmount are changing or were specified
    if (amount !== undefined || discountAmount !== undefined) {
      const currentTx = await prisma.transaction.findUnique({ where: { id } });
      if (currentTx) {
        const finalAmt = (updateData.amount ?? currentTx.amount) - (updateData.discountAmount ?? currentTx.discountAmount ?? 0);
        updateData.finalAmount = finalAmt;
      }
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      transaction,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update transaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await params;
    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
