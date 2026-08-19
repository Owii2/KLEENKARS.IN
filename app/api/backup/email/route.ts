import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";
import { sendMonthlyBackupEmail, generateMonthlyCsvBackups } from "@/lib/backupEngine";

export async function GET(req: Request) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || undefined;
    const backupData = await generateMonthlyCsvBackups(month);

    return NextResponse.json({
      success: true,
      monthLabel: backupData.monthLabel,
      files: backupData.files.map((f) => ({
        filename: f.filename,
        category: f.category,
        recordCount: f.recordCount,
      })),
      summary: backupData.summary,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to generate backup preview" },
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
    let month: string | undefined;
    let recipientEmail: string | undefined;

    try {
      const body = await req.json();
      month = body.month;
      recipientEmail = body.recipientEmail;
    } catch {}

    const result = await sendMonthlyBackupEmail({
      month,
      recipientEmail: recipientEmail || "owii.rajput@gmail.com",
      triggeredBy: auth.user?.name || "Admin",
    });

    return NextResponse.json({
      success: true,
      message: `Monthly backup for ${result.monthLabel} (${result.attachedFiles.length} separate CSVs) emailed successfully to ${result.recipient}!`,
      result,
    });
  } catch (error: any) {
    console.error("Backup Email Dispatch Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to send backup email" },
      { status: 500 }
    );
  }
}
