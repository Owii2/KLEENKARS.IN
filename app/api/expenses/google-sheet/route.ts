import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/apiAuth";

// Helper to parse CSV safely supporting quotes and commas
function parseCsvContent(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if ((char === "\r" || char === "\n") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// Convert column letter (A, B, C... Z, AA) to zero-based index
function letterToIndex(letter: string): number {
  let index = 0;
  const upper = letter.toUpperCase().trim();
  for (let i = 0; i < upper.length; i++) {
    index = index * 26 + (upper.charCodeAt(i) - 64);
  }
  return index - 1;
}

function findColumnIndex(headers: string[], possibleNames: string[], customOverride?: string): number {
  if (customOverride && customOverride.trim()) {
    const override = customOverride.trim();
    if (/^[A-Za-z]+$/.test(override)) {
      return letterToIndex(override);
    }
    const idx = headers.findIndex((h) => h.toLowerCase().trim() === override.toLowerCase().trim());
    if (idx !== -1) return idx;
  }

  const normalizedHeaders = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  for (const name of possibleNames) {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const idx = normalizedHeaders.findIndex((h) => h === cleanName || h.includes(cleanName));
    if (idx !== -1) return idx;
  }
  return -1;
}

// Strict UPPERCASE converter for all fields
function toUpperStr(val: any): string | null {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  if (str.length === 0 || str === "." || str === "-" || str === "--" || str.toLowerCase() === "n/a" || str.toLowerCase() === "na" || str.toLowerCase() === "null" || str.toLowerCase() === "none") {
    return null;
  }
  return str.toUpperCase();
}

function normalizeDate(rawDate: string): Date {
  if (!rawDate) return new Date();
  const cleaned = rawDate.trim().replace(/\//g, "-").replace(/\./g, "-");

  // Format: MM-DD-YYYY or MM/DD/YYYY (MONTH / DATE / YEAR)
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(cleaned)) {
    const [m, d, y] = cleaned.split("-");
    const dateObj = new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T00:00:00.000Z`);
    if (!isNaN(dateObj.getTime())) return dateObj;
  }

  // Format: MM-DD-YY or MM/DD/YY (2-digit year)
  if (/^\d{1,2}-\d{1,2}-\d{2}$/.test(cleaned)) {
    const [m, d, yy] = cleaned.split("-");
    const y = parseInt(yy, 10) < 50 ? `20${yy}` : `19${yy}`;
    const dateObj = new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T00:00:00.000Z`);
    if (!isNaN(dateObj.getTime())) return dateObj;
  }

  // Format: YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(cleaned)) {
    const [y, m, d] = cleaned.split("-");
    const dateObj = new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T00:00:00.000Z`);
    if (!isNaN(dateObj.getTime())) return dateObj;
  }

  const parsed = new Date(cleaned);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function extractSheetId(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

export async function GET(req: Request) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    let googleSheetUrl = searchParams.get("url") || "";
    const sheetName = searchParams.get("sheet") || "";

    if (!googleSheetUrl) {
      const setting = await prisma.systemSetting.findUnique({ where: { key: "google_sheet_expense_url" } });
      if (setting && setting.value) googleSheetUrl = setting.value;
    }

    if (!googleSheetUrl) {
      return NextResponse.json(
        { success: false, message: "No Google Sheet URL specified. Please provide a valid sheet URL." },
        { status: 400 }
      );
    }

    const sheetId = extractSheetId(googleSheetUrl);
    let csvUrl = googleSheetUrl;
    if (sheetId) {
      csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${
        sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : ""
      }`;
    }

    const response = await fetch(csvUrl, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `Unable to access Google Sheet (HTTP ${response.status}). Make sure the sheet is shared with 'Anyone with the link can view'.`,
        },
        { status: 400 }
      );
    }

    const csvText = await response.text();
    const rows = parseCsvContent(csvText);

    if (rows.length < 2) {
      return NextResponse.json(
        { success: false, message: "Google Sheet contains no data rows." },
        { status: 400 }
      );
    }

    const headers = rows[0];

    // Detect column indexes
    const detected = {
      date: findColumnIndex(headers, ["date", "expensedate", "billdate", "entrydate", "day", "timestamp"]),
      amount: findColumnIndex(headers, ["amount", "cost", "price", "total", "paid", "expenseamount", "billamount"]),
      category: findColumnIndex(headers, ["category", "expensecategory", "type", "head", "expensehead"]),
      description: findColumnIndex(headers, ["title", "description", "item", "particulars", "detail", "expensename", "itemname"]),
      paidTo: findColumnIndex(headers, ["paidto", "vendor", "payee", "receiver", "supplier", "party", "name"]),
      paymentMode: findColumnIndex(headers, ["paymentmode", "mode", "paymenttype", "payment", "type", "method", "cashupi"]),
      invoiceNumber: findColumnIndex(headers, ["invoicenumber", "invoiceno", "billno", "receiptno", "refid", "voucher"]),
      notes: findColumnIndex(headers, ["notes", "remarks", "comment", "memo"]),
      branch: findColumnIndex(headers, ["branch", "location", "center"]),
    };

    // Build preview with uppercase transformation
    const previewRows = rows.slice(1, 11).map((r, rowIdx) => {
      const rawDate = detected.date !== -1 ? r[detected.date] : "";
      const rawAmount = detected.amount !== -1 ? r[detected.amount] : "0";
      const amtClean = String(rawAmount || "").replace(/[^0-9.]/g, "");
      const amount = amtClean === "" ? 0 : parseInt(amtClean, 10);

      return {
        rowNumber: rowIdx + 2,
        date: rawDate ? normalizeDate(rawDate).toISOString().split("T")[0] : "",
        rawDate,
        amount: isNaN(amount) ? 0 : amount,
        category: detected.category !== -1 ? toUpperStr(r[detected.category]) : null,
        description: detected.description !== -1 ? toUpperStr(r[detected.description]) : null,
        paidTo: detected.paidTo !== -1 ? toUpperStr(r[detected.paidTo]) : null,
        paymentMode: detected.paymentMode !== -1 ? toUpperStr(r[detected.paymentMode]) || "CASH" : "CASH",
        invoiceNumber: detected.invoiceNumber !== -1 ? toUpperStr(r[detected.invoiceNumber]) : null,
        notes: detected.notes !== -1 ? toUpperStr(r[detected.notes]) : null,
        branch: detected.branch !== -1 ? toUpperStr(r[detected.branch]) : null,
      };
    });

    return NextResponse.json({
      success: true,
      headers,
      detectedColumns: detected,
      totalRows: rows.length - 1,
      preview: previewRows,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to preview Google Sheet" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    let { googleSheetUrl, sheetName, startRow = 2, customColumns = {} } = body;

    if (!googleSheetUrl) {
      const setting = await prisma.systemSetting.findUnique({ where: { key: "google_sheet_expense_url" } });
      if (setting && setting.value) googleSheetUrl = setting.value;
    }

    if (!googleSheetUrl) {
      return NextResponse.json(
        { success: false, message: "Google Sheet URL is required for Expense Auto Sync." },
        { status: 400 }
      );
    }

    // Save as default setting
    await prisma.systemSetting.upsert({
      where: { key: "google_sheet_expense_url" },
      update: { value: googleSheetUrl },
      create: { key: "google_sheet_expense_url", value: googleSheetUrl },
    });

    if (sheetName) {
      await prisma.systemSetting.upsert({
        where: { key: "google_sheet_expense_sheet_name" },
        update: { value: sheetName },
        create: { key: "google_sheet_expense_sheet_name", value: sheetName },
      });
    }

    const sheetId = extractSheetId(googleSheetUrl);
    let csvUrl = googleSheetUrl;
    if (sheetId) {
      csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${
        sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : ""
      }`;
    }

    const response = await fetch(csvUrl, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `Unable to access Google Sheet (HTTP ${response.status}). Please ensure sheet is shared with 'Anyone with the link can view'.`,
        },
        { status: 400 }
      );
    }

    const csvText = await response.text();
    const rows = parseCsvContent(csvText);

    if (rows.length < 2) {
      return NextResponse.json(
        { success: false, message: "Google Sheet contains no data rows." },
        { status: 400 }
      );
    }

    const headers = rows[0];

    // Column detection with custom column overrides
    const dateIdx = findColumnIndex(headers, ["date", "expensedate", "billdate", "entrydate", "day", "timestamp"], customColumns.date);
    const amountIdx = findColumnIndex(headers, ["amount", "cost", "price", "total", "paid", "expenseamount", "billamount"], customColumns.amount);
    const categoryIdx = findColumnIndex(headers, ["category", "expensecategory", "type", "head", "expensehead"], customColumns.category);
    const descriptionIdx = findColumnIndex(headers, ["title", "description", "item", "particulars", "detail", "expensename", "itemname"], customColumns.description);
    const paidToIdx = findColumnIndex(headers, ["paidto", "vendor", "payee", "receiver", "supplier", "party", "name"], customColumns.paidTo);
    const paymentModeIdx = findColumnIndex(headers, ["paymentmode", "mode", "paymenttype", "payment", "type", "method", "cashupi"], customColumns.paymentMode);
    const invoiceNumberIdx = findColumnIndex(headers, ["invoicenumber", "invoiceno", "billno", "receiptno", "refid", "voucher"], customColumns.invoiceNumber);
    const notesIdx = findColumnIndex(headers, ["notes", "remarks", "comment", "memo"], customColumns.notes);
    const branchIdx = findColumnIndex(headers, ["branch", "location", "center"], customColumns.branch);

    if (amountIdx === -1) {
      return NextResponse.json(
        {
          success: false,
          message: `Required 'Amount' column not found in Google Sheet headers: [${headers.join(", ")}]. Please specify column letters in mapping.`,
        },
        { status: 400 }
      );
    }

    // Fetch existing expenses to avoid duplicates
    const existingExpenses = await prisma.expense.findMany({
      select: {
        date: true,
        amount: true,
        description: true,
        paidTo: true,
        invoiceNumber: true,
      },
    });

    const existingSignatures = new Set<string>();
    for (const exp of existingExpenses) {
      const dStr = exp.date.toISOString().split("T")[0];
      const sig = exp.invoiceNumber
        ? `inv:${exp.invoiceNumber.toUpperCase()}`
        : `${dStr}|${exp.amount}|${(exp.description || "").toUpperCase()}|${(exp.paidTo || "").toUpperCase()}`;
      existingSignatures.add(sig);
    }

    const startRowIdx = Math.max(1, parseInt(String(startRow), 10) - 1);
    const newExpensesData: any[] = [];
    let skippedCount = 0;
    let totalAmount = 0;

    for (let r = startRowIdx; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0 || row.every((c) => c.trim() === "")) continue;

      const rawDateStr = dateIdx !== -1 && row[dateIdx] ? row[dateIdx].trim() : "";
      const dateObj = normalizeDate(rawDateStr);
      const normalizedDateStr = dateObj.toISOString().split("T")[0];

      const rawAmount = amountIdx !== -1 ? row[amountIdx] : "0";
      const amtClean = String(rawAmount || "").replace(/[^0-9.]/g, "");
      const parsedAmount = amtClean === "" ? 0 : parseInt(amtClean, 10);

      if (isNaN(parsedAmount)) continue;

      // STRICT UPPERCASE CONVERSION FOR ALL STRING FIELDS
      const categoryStr = categoryIdx !== -1 ? toUpperStr(row[categoryIdx]) : null;
      const descriptionStr = descriptionIdx !== -1 ? toUpperStr(row[descriptionIdx]) : null;
      const paidToStr = paidToIdx !== -1 ? toUpperStr(row[paidToIdx]) : null;
      const paymentModeStr = paymentModeIdx !== -1 ? toUpperStr(row[paymentModeIdx]) || "CASH" : "CASH";
      const invoiceNumberStr = invoiceNumberIdx !== -1 ? toUpperStr(row[invoiceNumberIdx]) : null;
      const notesStr = notesIdx !== -1 ? toUpperStr(row[notesIdx]) : null;
      const branchStr = branchIdx !== -1 ? toUpperStr(row[branchIdx]) : null;

      const currentSignature = invoiceNumberStr
        ? `inv:${invoiceNumberStr}`
        : `${normalizedDateStr}|${parsedAmount}|${descriptionStr || ""}|${paidToStr || ""}`;

      if (existingSignatures.has(currentSignature)) {
        skippedCount++;
        continue;
      }

      existingSignatures.add(currentSignature);

      newExpensesData.push({
        date: dateObj,
        amount: parsedAmount,
        category: categoryStr || "OPERATIONAL",
        description: descriptionStr || "GENERAL EXPENSE",
        paidTo: paidToStr || null,
        paymentMode: paymentModeStr,
        invoiceNumber: invoiceNumberStr || null,
        notes: notesStr || null,
        branch: branchStr || null,
        createdBy: "GOOGLE SHEET AUTO-SYNC",
      });

      totalAmount += parsedAmount;
    }

    if (newExpensesData.length > 0) {
      const chunkSize = 200;
      for (let i = 0; i < newExpensesData.length; i += chunkSize) {
        const chunk = newExpensesData.slice(i, i + chunkSize);
        await prisma.expense.createMany({
          data: chunk,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${newExpensesData.length} expense records from Google Sheet into database (ALL CAPS converted)!`,
      importedCount: newExpensesData.length,
      skippedCount,
      totalRowsProcessed: rows.length - startRowIdx,
      totalAmount,
    });
  } catch (error: any) {
    console.error("Expense Google Sheet Sync Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to synchronize expenses from Google Sheet" },
      { status: 500 }
    );
  }
}
