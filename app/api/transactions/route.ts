import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";
import { matchServiceWithPrice } from "@/lib/serviceMatcher";

export async function GET(req: Request) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const customerName = searchParams.get("customerName");
    const vehicleNumber = searchParams.get("vehicleNumber");
    const serviceOpted = searchParams.get("serviceOpted");
    const assignedEmployee = searchParams.get("assignedEmployee");
    const paymentMode = searchParams.get("paymentMode");

    const where: any = {};

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = startDate;
      }
      if (endDate) {
        where.date.lte = endDate;
      }
    }

    if (customerName) {
      where.customerName = {
        contains: customerName,
        mode: "insensitive",
      };
    }

    if (vehicleNumber) {
      where.vehicleNumber = {
        contains: vehicleNumber,
        mode: "insensitive",
      };
    }

    if (serviceOpted) {
      where.serviceOpted = {
        contains: serviceOpted,
        mode: "insensitive",
      };
    }

    if (assignedEmployee) {
      where.assignedEmployee = {
        contains: assignedEmployee,
        mode: "insensitive",
      };
    }

    if (paymentMode) {
      where.paymentMode = {
        equals: paymentMode,
        mode: "insensitive",
      };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: [
        { date: "desc" },
        { createdAt: "desc" }
      ],
    });

    return NextResponse.json({
      success: true,
      transactions,
    });
  } catch (error: any) {
    console.error("GET Transactions Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) {
    return auth.response;
  }

  try {
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

    // Validation for required fields
    if (!date) {
      return NextResponse.json(
        { success: false, message: "Date is required" },
        { status: 400 }
      );
    }
    if (amount === undefined || amount === null) {
      return NextResponse.json(
        { success: false, message: "Amount is required" },
        { status: 400 }
      );
    }
    if (!paymentMode) {
      return NextResponse.json(
        { success: false, message: "Payment mode is required" },
        { status: 400 }
      );
    }

    const parsedAmount = parseInt(amount, 10);
    const parsedDiscount = discountAmount ? parseInt(discountAmount, 10) : 0;
    const finalAmount = parsedAmount - parsedDiscount;

    // Auto-detect service and vehicle type from price if empty or not provided
    let resolvedServiceOpted = serviceOpted;
    let resolvedVehicleType = vehicleType;
    if (!resolvedServiceOpted || String(resolvedServiceOpted).trim() === "" || !resolvedVehicleType || String(resolvedVehicleType).trim() === "") {
      const match = await matchServiceWithPrice(parsedAmount);
      if (match) {
        if (!resolvedServiceOpted || String(resolvedServiceOpted).trim() === "") {
          resolvedServiceOpted = match.serviceOpted;
        }
        if (!resolvedVehicleType || String(resolvedVehicleType).trim() === "") {
          resolvedVehicleType = match.vehicleType;
        }
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        date,
        amount: parsedAmount,
        paymentMode,
        time: time || null,
        customerName: customerName || null,
        customerMobile: customerMobile || null,
        customerId: customerId || null,
        vehicleNumber: vehicleNumber || null,
        vehicleType: resolvedVehicleType || null,
        serviceOpted: resolvedServiceOpted || null,
        addonServices: addonServices || null,
        assignedEmployee: assignedEmployee || null,
        discountAmount: parsedDiscount,
        finalAmount,
        notes: notes || null,
        createdBy: auth.user?.name || "System",
      },
    });

    return NextResponse.json({
      success: true,
      transaction,
    });
  } catch (error: any) {
    console.error("POST Transaction Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create transaction" },
      { status: 500 }
    );
  }
}
