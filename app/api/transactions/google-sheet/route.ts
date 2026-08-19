import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";
import { matchServiceWithPrice } from "@/lib/serviceMatcher";

// Helper to convert column letter or cell reference (e.g. 'A', 'A2', 'B2', 'AA') to 0-indexed column index
function columnLetterToIndex(letter: string): number {
  const clean = letter.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  // Matches cell reference like "A2", "B2", "AA2" or column letters like "A", "B", "AA"
  const letterMatch = clean.match(/^([A-Z]+)\d*$/);
  if (letterMatch && letterMatch[1]) {
    const letters = letterMatch[1];
    let index = 0;
    for (let i = 0; i < letters.length; i++) {
      index = index * 26 + (letters.charCodeAt(i) - 64);
    }
    return index - 1;
  }
  const num = parseInt(clean, 10);
  if (!isNaN(num) && num >= 1) return num - 1;
  return -1;
}

// Helper to convert any Google Sheet link into a direct CSV export URL for a specific sheet tab
export function convertToGoogleSheetCsvUrl(rawUrl: string, sheetName?: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";

  // Matches https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/...
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const spreadsheetId = match[1];

    // If specific sheet tab name is provided, use Google Visualization query format
    if (sheetName && sheetName.trim()) {
      return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName.trim())}`;
    }

    // Check if a specific gid (sheet tab) is in the URL (e.g. #gid=12345 or ?gid=12345)
    const gidMatch = trimmed.match(/gid=([0-9]+)/);
    if (gidMatch && gidMatch[1]) {
      return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gidMatch[1]}`;
    }

    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
  }

  return trimmed;
}

// Helper to parse standard CSV text safely
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
        i++; // skip next escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some(cell => cell.length > 0)) {
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
    if (currentRow.some(cell => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// Normalize various date formats to YYYY-MM-DD
function normalizeDate(rawDate: string): string {
  if (!rawDate) return new Date().toISOString().split("T")[0];
  const cleaned = rawDate.trim().replace(/\//g, "-").replace(/\./g, "-");

  // Format: YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(cleaned)) {
    const [y, m, d] = cleaned.split("-");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Format: DD-MM-YYYY
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(cleaned)) {
    const [d, m, y] = cleaned.split("-");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Fallback with standard Date parsing
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return new Date().toISOString().split("T")[0];
}

// Helper to convert any value to UPPERCASE string safely, keeping blank/empty as null
function toUpperStr(val: any): string | null {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  if (s.length === 0 || s === "." || s === "-" || s === "--" || s.toLowerCase() === "n/a" || s.toLowerCase() === "na" || s.toLowerCase() === "null" || s.toLowerCase() === "none") {
    return null;
  }
  return s.toUpperCase();
}

const VEHICLE_KEYWORDS = new Set([
  "BIKE", "CAR", "SUV", "SEDAN", "HATCHBACK", "MUV", "GLANZA", "KIA", "JEEP", 
  "TIAGO", "ECO SPORT", "ACTIVA", "SX4", "BALENO", "SWIFT", "E-RICKSHAW", "NEXON", 
  "KWID", "IGNIS", "FORTUNER", "I-10", "I10", "I20", "I-20", "XUV", "SCOOTY", 
  "SCORPIO N", "SCORPIO", "BREZZA", "CRETA", "WAGON R", "WAGNOR", "VITARA", "BMW", 
  "DZIRE", "THAR", "DUMPER", "VERNA", "SANTRO", "HYRYDER", "XUV 700", "XUV300", 
  "HYCROSS", "INNOVA", "CIAZ", "SELTOS", "ALTO", "CITY", "AMAZE", "BULLET", "SPLENDOR",
  "PULSAR", "ROYAL ENFIELD", "APACHE", "JUPITER", "ACCESS", "DIO", "AURA", "CARENS",
  "SONET", "VENUE", "KIGER", "MAGNITE", "BOLERO", "ERTIGA", "TRIBER", "TAIGUN", "KUSHAQ"
]);

function isVehicleKeyword(name: string | null | undefined): boolean {
  if (!name) return false;
  return VEHICLE_KEYWORDS.has(name.trim().toUpperCase());
}

// Intelligent Header Mapping with fallback to user-specified column letters/indexes
function findColumnIndex(headers: string[], possibleNames: string[], customOverride?: string): number {
  if (customOverride && customOverride.trim()) {
    const customClean = customOverride.trim();
    // If it's a letter (e.g. 'A', 'B', 'C') or 1-based number
    if (/^[A-Za-z]+$/.test(customClean) || /^\d+$/.test(customClean)) {
      const idx = columnLetterToIndex(customClean);
      if (idx >= 0 && idx < headers.length) return idx;
    }
    // Check if custom override matches a header name exactly
    const exactIdx = headers.findIndex(h => h.trim().toLowerCase() === customClean.toLowerCase());
    if (exactIdx !== -1) return exactIdx;
  }

  const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  
  // 1. First Pass: Exact Match
  for (const name of possibleNames) {
    const cleanTarget = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const idx = normalizedHeaders.findIndex(h => h === cleanTarget);
    if (idx !== -1) return idx;
  }

  // 2. Second Pass: Substring Match
  for (const name of possibleNames) {
    const cleanTarget = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const idx = normalizedHeaders.findIndex(h => h.includes(cleanTarget));
    if (idx !== -1) return idx;
  }

  return -1;
}

export async function GET() {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const [urlSetting, sheetNameSetting, autoSyncSetting, customColsSetting, webhookSetting, lastSyncSetting] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: "google_sheet_transactions_url" } }),
      prisma.systemSetting.findUnique({ where: { key: "google_sheet_transactions_sheet_name" } }),
      prisma.systemSetting.findUnique({ where: { key: "google_sheet_auto_sync_enabled" } }),
      prisma.systemSetting.findUnique({ where: { key: "google_sheet_transactions_custom_columns" } }),
      prisma.systemSetting.findUnique({ where: { key: "google_sheet_webhook_url" } }),
      prisma.systemSetting.findUnique({ where: { key: "google_sheet_last_sync_info" } }),
    ]);

    let lastSyncInfo = null;
    if (lastSyncSetting?.value) {
      try {
        lastSyncInfo = JSON.parse(lastSyncSetting.value);
      } catch {
        lastSyncInfo = { raw: lastSyncSetting.value };
      }
    }

    let customColumns = {};
    if (customColsSetting?.value) {
      try {
        customColumns = JSON.parse(customColsSetting.value);
      } catch {
        customColumns = {};
      }
    }

    return NextResponse.json({
      success: true,
      sheetUrl: urlSetting?.value || "",
      sheetName: sheetNameSetting?.value || "",
      autoSync: autoSyncSetting?.value === "true",
      webhookUrl: webhookSetting?.value || "",
      customColumns,
      lastSync: lastSyncInfo,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch Google Sheet configuration" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { sheetUrl, sheetName, autoSync, webhookUrl, customColumns } = body;

    if (sheetUrl !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: "google_sheet_transactions_url" },
        update: { value: String(sheetUrl).trim() },
        create: { key: "google_sheet_transactions_url", value: String(sheetUrl).trim() },
      });
    }

    if (sheetName !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: "google_sheet_transactions_sheet_name" },
        update: { value: String(sheetName).trim() },
        create: { key: "google_sheet_transactions_sheet_name", value: String(sheetName).trim() },
      });
    }

    if (autoSync !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: "google_sheet_auto_sync_enabled" },
        update: { value: String(autoSync) },
        create: { key: "google_sheet_auto_sync_enabled", value: String(autoSync) },
      });
    }

    if (webhookUrl !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: "google_sheet_webhook_url" },
        update: { value: String(webhookUrl).trim() },
        create: { key: "google_sheet_webhook_url", value: String(webhookUrl).trim() },
      });
    }

    if (customColumns !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: "google_sheet_transactions_custom_columns" },
        update: { value: JSON.stringify(customColumns) },
        create: { key: "google_sheet_transactions_custom_columns", value: JSON.stringify(customColumns) },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Google Sheet settings saved successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to save settings" },
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
    let sheetUrl = "";
    let sheetName = "";
    let customColumns: Record<string, string> = {};

    try {
      const body = await req.json();
      sheetUrl = body.sheetUrl || "";
      sheetName = body.sheetName || "";
      customColumns = body.customColumns || {};
    } catch {
      // Body may be empty if triggered as simple sync
    }

    // If no sheetUrl provided in body, load from database setting or env
    if (!sheetUrl) {
      const urlSetting = await prisma.systemSetting.findUnique({
        where: { key: "google_sheet_transactions_url" }
      });
      sheetUrl = urlSetting?.value || process.env.GOOGLE_SHEET_TRANSACTIONS_URL || "";
    }

    if (!sheetName) {
      const sheetNameSetting = await prisma.systemSetting.findUnique({
        where: { key: "google_sheet_transactions_sheet_name" }
      });
      sheetName = sheetNameSetting?.value || "";
    }

    if (Object.keys(customColumns).length === 0) {
      const customColsSetting = await prisma.systemSetting.findUnique({
        where: { key: "google_sheet_transactions_custom_columns" }
      });
      if (customColsSetting?.value) {
        try {
          customColumns = JSON.parse(customColsSetting.value);
        } catch {}
      }
    }

    if (!sheetUrl.trim()) {
      return NextResponse.json(
        { success: false, message: "Please provide or save a Google Sheet URL first." },
        { status: 400 }
      );
    }

    const csvUrl = convertToGoogleSheetCsvUrl(sheetUrl, sheetName);

    // Fetch CSV content from Google Sheets
    const response = await fetch(csvUrl, {
      headers: {
        "User-Agent": "Kleenkars-Transactions-Sync/1.0",
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `Unable to access Google Sheet (HTTP ${response.status}). Please make sure your sheet is set to 'Anyone with the link can view' or published to web as CSV.${sheetName ? ` Also verify sheet tab '${sheetName}' exists.` : ''}`,
        },
        { status: 400 }
      );
    }

    const csvText = await response.text();
    const rows = parseCsvContent(csvText);

    if (rows.length < 2) {
      return NextResponse.json(
        { success: false, message: `Google Sheet contains no data rows in sheet '${sheetName || "Default"}'.` },
        { status: 400 }
      );
    }

    const headers = rows[0];

    // Find column indexes (with custom letter/header overrides)
    const dateIdx = findColumnIndex(headers, ["date", "transdate", "entrydate", "bookingdate", "day", "timestamp"], customColumns.date);
    const amountIdx = findColumnIndex(headers, ["amount", "cost", "price", "total", "paid", "billamount", "charge"], customColumns.amount);
    const paymentModeIdx = findColumnIndex(headers, ["paymentmode", "mode", "paymenttype", "payment", "type", "method", "cashupi"], customColumns.paymentMode);
    const timeIdx = findColumnIndex(headers, ["time", "timing", "hours", "slot"], customColumns.time);
    const customerNameIdx = findColumnIndex(headers, ["customername", "name", "customer", "client", "user", "owner"], customColumns.customerName);
    const customerMobileIdx = findColumnIndex(headers, ["customermobile", "phone", "mobile", "contact", "phonenumber", "mobilenumber"], customColumns.customerMobile);
    const vehicleNumberIdx = findColumnIndex(headers, ["vehiclenumber", "vehicleno", "platenumber", "carnumber", "carno", "regnumber", "numberplate"], customColumns.vehicleNumber);
    const vehicleTypeIdx = findColumnIndex(headers, ["vehicletype", "cartype", "vehiclemodel", "model"], customColumns.vehicleType);
    const serviceOptedIdx = findColumnIndex(headers, ["serviceopted", "service", "washtype", "package", "servicename", "wash"], customColumns.serviceOpted);
    const addonServicesIdx = findColumnIndex(headers, ["addonservices", "addons", "extraservices", "extras"], customColumns.addonServices);
    const assignedEmployeeIdx = findColumnIndex(headers, ["assignedemployee", "staff", "employee", "washer", "worker", "technician"], customColumns.assignedEmployee);
    const discountAmountIdx = findColumnIndex(headers, ["discountamount", "discount", "coupondiscount"], customColumns.discountAmount);
    const notesIdx = findColumnIndex(headers, ["notes", "remarks", "comment", "description"], customColumns.notes);
    const invoiceIdIdx = findColumnIndex(headers, ["invoiceid", "invoiceno", "billno", "refid", "txnid"], customColumns.invoiceId);

    if (dateIdx === -1 || amountIdx === -1) {
      return NextResponse.json(
        {
          success: false,
          message: `Required columns not found in Google Sheet '${sheetName || "Default"}'. Found headers: [${headers.join(", ")}]. Please include at least 'Date' and 'Amount' headers or specify column letters in Custom Columns.`,
        },
        { status: 400 }
      );
    }

    // Fetch existing transactions to perform smart deduplication
    const existingTransactions = await prisma.transaction.findMany({
      select: {
        id: true,
        date: true,
        amount: true,
        paymentMode: true,
        vehicleNumber: true,
        customerName: true,
        invoiceId: true,
        time: true,
      },
    });

    // Create a Set of existing signatures for fast lookup
    const existingSignatures = new Set<string>();
    for (const t of existingTransactions) {
      // Signature format: date|amount|paymentMode|vehicleNumber|customerName
      const sig = `${t.date}|${t.amount}|${(t.paymentMode || "").toUpperCase()}|${(t.vehicleNumber || "").toUpperCase()}|${(t.customerName || "").toUpperCase()}`;
      existingSignatures.add(sig);
      if (t.invoiceId) {
        existingSignatures.add(`inv:${t.invoiceId.toUpperCase()}`);
      }
    }

    let addedCount = 0;
    let skippedCount = 0;
    const newTransactionsData: any[] = [];
    const errors: string[] = [];

    // Iterate through sheet rows
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const rawDate = row[dateIdx] || "";
      const rawAmount = row[amountIdx] || "";
      const rawPaymentMode = paymentModeIdx !== -1 ? row[paymentModeIdx] : "CASH";

      // Clean amount (allow 0 for pending bills)
      const cleanedAmountStr = String(rawAmount).replace(/[^0-9.]/g, "");
      const parsedAmount = cleanedAmountStr === "" ? 0 : parseInt(cleanedAmountStr, 10);

      if (!rawDate || isNaN(parsedAmount) || parsedAmount < 0) {
        skippedCount++;
        continue;
      }

      const normalizedDateStr = normalizeDate(rawDate);
      
      const paymentModeStr = toUpperStr(rawPaymentMode) || "CASH";
      let customerNameStr = customerNameIdx !== -1 ? toUpperStr(row[customerNameIdx]) : null;
      if (customerNameStr && isVehicleKeyword(customerNameStr)) {
        customerNameStr = null;
      }
      const customerMobileStr = customerMobileIdx !== -1 && row[customerMobileIdx] ? row[customerMobileIdx].trim() : null;
      const vehicleNumberStr = vehicleNumberIdx !== -1 ? toUpperStr(row[vehicleNumberIdx]) : null;
      let vehicleTypeStr = vehicleTypeIdx !== -1 ? toUpperStr(row[vehicleTypeIdx]) : null;
      let serviceOptedStr = serviceOptedIdx !== -1 ? toUpperStr(row[serviceOptedIdx]) : null;
      const addonServicesStr = addonServicesIdx !== -1 ? toUpperStr(row[addonServicesIdx]) : null;
      const assignedEmployeeStr = assignedEmployeeIdx !== -1 ? toUpperStr(row[assignedEmployeeIdx]) : null;
      const discountAmountVal = discountAmountIdx !== -1 && row[discountAmountIdx] ? parseInt(row[discountAmountIdx].replace(/[^0-9.]/g, ""), 10) || 0 : 0;
      const rawNotesStr = notesIdx !== -1 ? toUpperStr(row[notesIdx]) : null;
      const timeStr = timeIdx !== -1 && row[timeIdx] ? row[timeIdx].trim() : null;
      const invoiceIdVal = invoiceIdIdx !== -1 ? toUpperStr(row[invoiceIdIdx]) : null;

      const currentSignature = invoiceIdVal
        ? `inv:${invoiceIdVal}`
        : `${normalizedDateStr}|${parsedAmount}|${paymentModeStr}|${vehicleNumberStr || ""}|${customerNameStr || ""}|${r}`;

      if (existingSignatures.has(currentSignature)) {
        skippedCount++;
        continue;
      }

      existingSignatures.add(currentSignature);

      // Auto-detect service and vehicle type from amount if missing
      if (!serviceOptedStr || !vehicleTypeStr) {
        const match = await matchServiceWithPrice(parsedAmount);
        if (match) {
          if (!serviceOptedStr) serviceOptedStr = toUpperStr(match.serviceOpted);
          if (!vehicleTypeStr) vehicleTypeStr = toUpperStr(match.vehicleType);
        }
      }

      const finalAmount = parsedAmount - discountAmountVal;

      newTransactionsData.push({
        date: normalizedDateStr,
        amount: parsedAmount,
        paymentMode: paymentModeStr,
        time: timeStr,
        customerName: customerNameStr,
        customerMobile: customerMobileStr,
        vehicleNumber: vehicleNumberStr,
        vehicleType: vehicleTypeStr,
        serviceOpted: serviceOptedStr,
        addonServices: addonServicesStr,
        assignedEmployee: assignedEmployeeStr,
        discountAmount: discountAmountVal,
        finalAmount,
        invoiceId: invoiceIdVal || `KK-${String(r).padStart(4, "0")}`,
        notes: rawNotesStr || null,
        createdBy: "GOOGLE SHEET SYNC",
      });

      // Mark signature as used so within-sheet duplicates are also skipped
      existingSignatures.add(currentSignature);
      if (invoiceIdVal) {
        existingSignatures.add(`inv:${invoiceIdVal}`);
      }
    }

    // Insert new transactions into database
    if (newTransactionsData.length > 0) {
      for (const tData of newTransactionsData) {
        try {
          await prisma.transaction.create({ data: tData });
          addedCount++;
        } catch (err: any) {
          errors.push(err.message || "Failed to insert transaction row");
        }
      }
    }

    // Update last sync info in system settings
    const syncInfo = {
      timestamp: new Date().toISOString(),
      sheetUrl,
      sheetName: sheetName || "Primary Sheet",
      totalRowsInSheet: rows.length - 1,
      addedCount,
      skippedCount,
      errorsCount: errors.length,
      performedBy: auth.user?.name || "Admin",
    };

    await prisma.systemSetting.upsert({
      where: { key: "google_sheet_last_sync_info" },
      update: { value: JSON.stringify(syncInfo) },
      create: { key: "google_sheet_last_sync_info", value: JSON.stringify(syncInfo) },
    });

    return NextResponse.json({
      success: true,
      message: `Sync complete from sheet '${sheetName || "Default"}'! ${addedCount} new transactions added (ALL CONVERTED TO UPPERCASE), ${skippedCount} duplicate/empty rows skipped.`,
      addedCount,
      skippedCount,
      totalRows: rows.length - 1,
      errors,
      syncInfo,
    });
  } catch (error: any) {
    console.error("Google Sheet Sync Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to sync transactions from Google Sheet",
      },
      { status: 500 }
    );
  }
}
