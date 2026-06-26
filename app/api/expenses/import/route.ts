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

// Helper to parse date string in diverse formats (e.g. DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
function parseFlexDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const cleaned = dateStr.trim();
  if (!cleaned) return null;

  // Try standard parse
  let d = new Date(cleaned);
  if (!isNaN(d.getTime())) return d;

  // Try DD/MM/YYYY or MM/DD/YYYY formats
  const parts = cleaned.split(/[\/\-]/);
  if (parts.length === 3) {
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);

    // If p2 is a 4-digit year
    if (p2 > 1000) {
      // Check if p0 is month or day. To support historical imports cleanly:
      // standard format from prompt: "4/11/2026,Electricity,BILL APRIL,3500,UPPCL,UPI" -> April 11 or Nov 4.
      // Let's assume MM/DD/YYYY if p0 <= 12, else DD/MM/YYYY. Better: try MM/DD/YYYY, if invalid or p0 > 12 use DD/MM/YYYY.
      if (p0 > 12) {
        // DD/MM/YYYY format
        d = new Date(p2, p1 - 1, p0);
      } else {
        // MM/DD/YYYY format
        d = new Date(p2, p0 - 1, p1);
      }
    }
  }

  return !isNaN(d.getTime()) ? d : null;
}

// POST /api/expenses/import - Bulk import CSV
export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await req.json();
    // Enable duplicate detection by default if not provided
    const { csvString, mapping, duplicateDetection = true } = body;

    // mapping: { date: string, amount: string, category?: string, description?: string, paidTo?: string, paymentMode?: string }
    if (!csvString || !mapping) {
      return NextResponse.json(
        { success: false, message: "Missing csvString or column mapping" },
        { status: 400 }
      );
    }

    const rawRows = await parseCsv(csvString);
    const validRows: any[] = [];
    const invalidRows: any[] = [];
    // Set to track duplicates within the current import batch (exact raw values)
    const seenKeys = new Set<string>();

    for (let idx = 0; idx < rawRows.length; idx++) {
      const rawRow = rawRows[idx];

      // Skip blank rows completely
      const isBlank = Object.values(rawRow).every((v) => !v || String(v).trim() === "");
      if (isBlank) continue;

      // Extract values according to mapped columns
      const dateVal = rawRow[mapping.date];
      const amountVal = rawRow[mapping.amount];
      const categoryVal = mapping.category ? rawRow[mapping.category] : null;
      const descriptionVal = mapping.description ? rawRow[mapping.description] : null;
      const paidToVal = mapping.paidTo ? rawRow[mapping.paidTo] : null;
      const paymentModeVal = mapping.paymentMode ? rawRow[mapping.paymentMode] : null;

      // Validate required fields
      const parsedDate = parseFlexDate(dateVal);
      const parsedAmount = parseInt(amountVal, 10);

      if (!parsedDate || isNaN(parsedAmount)) {
        invalidRows.push({
          rowNumber: idx + 1,
          rawRow,
          reason: `Invalid required fields. Date: ${dateVal} (parsed: ${parsedDate}), Amount: ${amountVal} (parsed: ${parsedAmount})`,
        });
        continue;
      }

      // Check duplicates if requested
      if (duplicateDetection) {
        // Normalize values for reliable duplicate detection
        const normCategory = (categoryVal || '').trim().toLowerCase();
        const normPaidTo = (paidToVal || '').trim().toLowerCase();
        const normDate = parsedDate ? parsedDate.toISOString() : '';
        const normAmount = parsedAmount;

        // In-memory duplicate detection for this batch (using normalized values)
        const batchKey = `${normDate}||${normAmount}||${normCategory}||${normPaidTo}`;
        if (seenKeys.has(batchKey)) {
          invalidRows.push({
            rowNumber: idx + 1,
            rawRow,
            reason: `Duplicate entry within import batch (Date: ${dateVal}, Amount: ${amountVal})`,
          });
          continue;
        }
        seenKeys.add(batchKey);

        // DB duplicate detection (using normalized values and calendar‑day matching)
        const dayStart = new Date(parsedDate);
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

        const dup = await prisma.expense.findFirst({
          where: {
            date: {
              gte: dayStart,
              lt: dayEnd,
            },
            amount: parsedAmount,
            category: normCategory ? { equals: normCategory, mode: 'insensitive' } : undefined,
            paidTo: normPaidTo ? { equals: normPaidTo, mode: 'insensitive' } : undefined,
          },
        });
        if (dup) {
          invalidRows.push({
            rowNumber: idx + 1,
            rawRow,
            reason: `Potential duplicate expense found in system (Date: ${dateVal}, Amount: ${amountVal})`,
          });
          continue;
        }
      }

      validRows.push({
        date: parsedDate,
        amount: parsedAmount,
        category: categoryVal || null,
        description: descriptionVal || null,
        paidTo: paidToVal || null,
        paymentMode: paymentModeVal || null,
        createdBy: auth.user?.name || "System Import",
      });
    }

    // Insert valid rows inside transaction
    let importedCount = 0;
    if (validRows.length > 0) {
      await prisma.$transaction(
        validRows.map((data) =>
          prisma.expense.create({
            data,
          })
        )
      );
      importedCount = validRows.length;
    }

    return NextResponse.json({
      success: true,
      importedCount,
      invalidCount: invalidRows.length,
      invalidRows,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to parse or import CSV data" },
      { status: 500 }
    );
  }
}
