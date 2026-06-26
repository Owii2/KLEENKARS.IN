import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";
import * as csv from "fast-csv";
import { Readable } from "stream";

// Helper to parse CSV string into JSON array
function parseCsv(csvString: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    const stream = Readable.from([csvString]);

    stream
      .pipe(csv.parse({ headers: true, discardUnmappedColumns: false }))
      .on("data", (data) => results.push(data))
      .on("error", (error) => reject(error))
      .on("end", () => resolve(results));
  });
}

// POST /api/expenses/import/preview - Get column headers and first 20 preview rows
export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { csvString } = body;

    if (!csvString) {
      return NextResponse.json(
        { success: false, message: "Missing csvString" },
        { status: 400 }
      );
    }

    const rawRows = await parseCsv(csvString);

    if (rawRows.length === 0) {
      return NextResponse.json({
        success: true,
        headers: [],
        previewRows: [],
        totalRows: 0,
      });
    }

    const headers = Object.keys(rawRows[0]);
    const previewRows = rawRows.slice(0, 20);

    return NextResponse.json({
      success: true,
      headers,
      previewRows,
      totalRows: rawRows.length,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to parse CSV preview" },
      { status: 500 }
    );
  }
}
