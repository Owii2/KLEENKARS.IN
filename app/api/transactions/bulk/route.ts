import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";
import { matchServiceWithPrice } from "@/lib/serviceMatcher";

export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { transactions } = body;

    if (!Array.isArray(transactions)) {
      return NextResponse.json(
        { success: false, message: "Invalid payload, transactions array expected" },
        { status: 400 }
      );
    }

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    // Process each transaction individually to skip invalid rows and log success/failure
    for (let i = 0; i < transactions.length; i++) {
      const row = transactions[i];
      try {
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
        } = row;

        if (!date || amount === undefined || amount === null || !paymentMode) {
          failCount++;
          errors.push(`Row ${i + 1}: Missing required fields (Date, Amount, or Payment Mode)`);
          continue;
        }

        const parsedAmount = parseInt(amount, 10);
        if (isNaN(parsedAmount)) {
          failCount++;
          errors.push(`Row ${i + 1}: Amount is not a valid number`);
          continue;
        }

        const parsedDiscount = discountAmount ? parseInt(discountAmount, 10) : 0;
        const finalAmount = parsedAmount - (isNaN(parsedDiscount) ? 0 : parsedDiscount);

        // Auto-detect service and vehicle type from price if empty or not provided
        let resolvedServiceOpted = serviceOpted ? String(serviceOpted).trim() : null;
        let resolvedVehicleType = vehicleType ? String(vehicleType).trim() : null;
        if (!resolvedServiceOpted || resolvedServiceOpted === "" || !resolvedVehicleType || resolvedVehicleType === "") {
          const match = await matchServiceWithPrice(parsedAmount);
          if (match) {
            if (!resolvedServiceOpted || resolvedServiceOpted === "") {
              resolvedServiceOpted = match.serviceOpted;
            }
            if (!resolvedVehicleType || resolvedVehicleType === "") {
              resolvedVehicleType = match.vehicleType;
            }
          }
        }

        await prisma.transaction.create({
          data: {
            date: String(date).trim(),
            amount: parsedAmount,
            paymentMode: String(paymentMode).trim(),
            time: time ? String(time).trim() : null,
            customerName: customerName ? String(customerName).trim() : null,
            customerMobile: customerMobile ? String(customerMobile).trim() : null,
            customerId: customerId ? String(customerId).trim() : null,
            vehicleNumber: vehicleNumber ? String(vehicleNumber).trim() : null,
            vehicleType: resolvedVehicleType || null,
            serviceOpted: resolvedServiceOpted || null,
            addonServices: addonServices ? String(addonServices).trim() : null,
            assignedEmployee: assignedEmployee ? String(assignedEmployee).trim() : null,
            discountAmount: isNaN(parsedDiscount) ? 0 : parsedDiscount,
            finalAmount,
            notes: notes ? String(notes).trim() : null,
            createdBy: auth.user?.name || "Import Wizard",
          },
        });

        successCount++;
      } catch (err: any) {
        failCount++;
        errors.push(`Row ${i + 1}: Database error: ${err.message || "Unknown error"}`);
      }
    }

    return NextResponse.json({
      success: true,
      successCount,
      failCount,
      errors,
    });
  } catch (error: any) {
    console.error("Bulk Import Transactions Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process bulk import" },
      { status: 500 }
    );
  }
}
