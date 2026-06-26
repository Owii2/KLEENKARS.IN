import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";
import * as csv from "fast-csv";
import { Readable } from "stream";

// Helper to pipe stream to string
function streamToString(stream: Readable): Promise<string> {
  const chunks: any[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

// GET /api/expenses/export - Export expenses as CSV based on filters
export async function GET(req: Request) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "";
  const paymentMode = searchParams.get("paymentMode") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const minAmount = searchParams.get("minAmount") || "";
  const maxAmount = searchParams.get("maxAmount") || "";
  const paidTo = searchParams.get("paidTo") || "";

  const where: any = {};

  if (category) where.category = category;
  if (paymentMode) where.paymentMode = paymentMode;
  if (paidTo) where.paidTo = { contains: paidTo, mode: "insensitive" };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  if (minAmount || maxAmount) {
    where.amount = {};
    if (minAmount) where.amount.gte = parseInt(minAmount, 10);
    if (maxAmount) where.amount.lte = parseInt(maxAmount, 10);
  }

  try {
    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
    });

    const csvRows = expenses.map((e) => ({
      ID: e.id,
      Date: e.date.toISOString().split("T")[0],
      Amount: e.amount,
      Category: e.category || "",
      Description: e.description || "",
      "Paid To": e.paidTo || "",
      "Payment Mode": e.paymentMode || "",
      "Invoice Number": e.invoiceNumber || "",
      "Vendor GST Number": e.vendorGSTNumber || "",
      Notes: e.notes || "",
      "Created By": e.createdBy || "",
      "Created At": e.createdAt.toISOString(),
    }));

    const csvStream = csv.format({ headers: true });
    csvRows.forEach((row) => csvStream.write(row));
    csvStream.end();

    const csvString = await streamToString(csvStream);

    return new Response(csvString, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="expenses_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to export CSV" },
      { status: 500 }
    );
  }
}
