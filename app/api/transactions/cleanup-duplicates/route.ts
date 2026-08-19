import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";
import { cleanupDuplicateTransactions } from "@/lib/googleSheetSync";

export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    let keepOnlyGoogleSheet = false;
    try {
      const body = await req.json();
      keepOnlyGoogleSheet = Boolean(body.keepOnlyGoogleSheet);
    } catch {}

    const result = await cleanupDuplicateTransactions(keepOnlyGoogleSheet);

    return NextResponse.json({
      message: `Cleaned up ${result.deletedCount} duplicate transactions! Remaining unique records: ${result.remainingCount}.`,
      ...result,
    });
  } catch (error: any) {
    console.error("Cleanup duplicates error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to cleanup duplicate transactions" },
      { status: 500 }
    );
  }
}
