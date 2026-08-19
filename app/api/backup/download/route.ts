import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";
import { generateMonthlyCsvBackups } from "@/lib/backupEngine";

export async function GET(req: Request) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || undefined;
    const type = (searchParams.get("type") || "sales").toLowerCase();

    const backupData = await generateMonthlyCsvBackups(month);

    // Match file type
    const file = backupData.files.find((f) =>
      f.filename.toLowerCase().includes(type) || f.category.toLowerCase().includes(type)
    ) || backupData.files[0];

    if (!file) {
      return NextResponse.json({ success: false, message: "Requested backup file not found" }, { status: 404 });
    }

    return new NextResponse(file.csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${file.filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to download backup CSV" },
      { status: 500 }
    );
  }
}
