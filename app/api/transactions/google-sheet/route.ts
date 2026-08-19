import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";
import { matchServiceWithPrice } from "@/lib/serviceMatcher";

// Helper to convert any Google Sheet link into a direct CSV export URL
export function convertToGoogleSheetCsvUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";

  // Already a direct CSV export or publish link
  if (trimmed.includes("/export?format=csv") || trimmed.includes("tqx=out:csv")) {
    return trimmed;
  }

  // Matches https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/...
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const spreadsheetId = match[1];
    
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

// Intelligent Header Mapping
function findColumnIndex(headers: string[], possibleNames: string[]): number {
  const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  for (const name of possibleNames) {
    const cleanTarget = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const idx = normalizedHeaders.findIndex(h => h === cleanTarget || h.includes(cleanTarget));
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
    const [urlSetting, autoSyncSetting, lastSyncSetting] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: "google_sheet_transactions_url" } }),
      prisma.systemSetting.findUnique({ where: { key: "google_sheet_auto_sync_enabled" } }),
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

    return NextResponse.json({
      success: true,
      sheetUrl: urlSetting?.value || "",
      autoSync: autoSyncSetting?.value === "true",
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
    const { sheetUrl, autoSync } = body;

    if (sheetUrl !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: "google_sheet_transactions_url" },
        update: { value: String(sheetUrl).trim() },
        create: { key: "google_sheet_transactions_url", value: String(sheetUrl).trim() },
      });
    }

    if (autoSync !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: "google_sheet_auto_sync_enabled" },
        update: { value: String(autoSync) },
        create: { key: "google_sheet_auto_sync_enabled", value: String(autoSync) },
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
    try {
      const body = await req.json();
      sheetUrl = body.sheetUrl || "";
    } catch {
      // Body may be empty if triggered as a simple sync action
    }

    // If no sheetUrl provided in body, load from database setting or env
    if (!sheetUrl) {
      const urlSetting = await prisma.systemSetting.findUnique({
        where: { key: "google_sheet_transactions_url" }
      });
      sheetUrl = urlSetting?.value || process.env.GOOGLE_SHEET_TRANSACTIONS_URL || "";
    }

    if (!sheetUrl.trim()) {
      return NextResponse.json(
        { success: false, message: "Please provide or save a Google Sheet URL first." },
        { status: 400 }
      );
    }

    const csvUrl = convertToGoogleSheetCsvUrl(sheetUrl);

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
          message: `Unable to access Google Sheet (HTTP ${response.status}). Please make sure your sheet is set to 'Anyone with the link can view' or published to web as CSV.`,
        },
        { status: 400 }
      );
    }

    const csvText = await response.text();
    const rows = parseCsvContent(csvText);

    if (rows.length < 2) {
      return NextResponse.json(
        { success: false, message: "Google Sheet contains no data rows (only header or empty)." },
        { status: 400 }
      );
    }

    const headers = rows[0];

    // Find column indexes
    const dateIdx = findColumnIndex(headers, ["date", "transdate", "entrydate", "bookingdate", "day", "timestamp"]);
    const amountIdx = findColumnIndex(headers, ["amount", "cost", "price", "total", "paid", "billamount", "charge"]);
    const paymentModeIdx = findColumnIndex(headers, ["paymentmode", "mode", "paymenttype", "payment", "type", "method", "cashupi"]);
    const timeIdx = findColumnIndex(headers, ["time", "timing", "hours", "slot"]);
    const customerNameIdx = findColumnIndex(headers, ["customername", "name", "customer", "client", "user", "owner"]);
    const customerMobileIdx = findColumnIndex(headers, ["customermobile", "phone", "mobile", "contact", "phonenumber", "mobilenumber"]);
    const vehicleNumberIdx = findColumnIndex(headers, ["vehiclenumber", "vehicleno", "platenumber", "carnumber", "carno", "regnumber", "numberplate"]);
    const vehicleTypeIdx = findColumnIndex(headers, ["vehicletype", "cartype", "vehiclemodel", "model"]);
    const serviceOptedIdx = findColumnIndex(headers, ["serviceopted", "service", "washtype", "package", "servicename", "wash"]);
    const addonServicesIdx = findColumnIndex(headers, ["addonservices", "addons", "extraservices", "extras"]);
    const assignedEmployeeIdx = findColumnIndex(headers, ["assignedemployee", "staff", "employee", "washer", "worker", "technician"]);
    const discountAmountIdx = findColumnIndex(headers, ["discountamount", "discount", "coupondiscount"]);
    const notesIdx = findColumnIndex(headers, ["notes", "remarks", "comment", "description"]);
    const invoiceIdIdx = findColumnIndex(headers, ["invoiceid", "invoiceno", "billno", "refid", "txnid"]);

    if (dateIdx === -1 || amountIdx === -1) {
      return NextResponse.json(
        {
          success: false,
          message: `Required columns not found in Google Sheet. Found headers: [${headers.join(", ")}]. Please include at least 'Date' and 'Amount' headers.`,
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
      const sig = `${t.date}|${t.amount}|${(t.paymentMode || "").toLowerCase()}|${(t.vehicleNumber || "").toLowerCase()}|${(t.customerName || "").toLowerCase()}`;
      existingSignatures.add(sig);
      if (t.invoiceId) {
        existingSignatures.add(`inv:${t.invoiceId.toLowerCase()}`);
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
      const rawPaymentMode = paymentModeIdx !== -1 ? row[paymentModeIdx] : "Cash";

      // Clean amount
      const cleanedAmountStr = String(rawAmount).replace(/[^0-9.]/g, "");
      const parsedAmount = parseInt(cleanedAmountStr, 10);

      if (!rawDate || isNaN(parsedAmount) || parsedAmount <= 0) {
        skippedCount++;
        continue;
      }

      const normalizedDateStr = normalizeDate(rawDate);
      const paymentModeStr = (rawPaymentMode || "Cash").trim();
      const customerNameStr = customerNameIdx !== -1 && row[customerNameIdx] ? row[customerNameIdx].trim() : null;
      const customerMobileStr = customerMobileIdx !== -1 && row[customerMobileIdx] ? row[customerMobileIdx].trim() : null;
      const vehicleNumberStr = vehicleNumberIdx !== -1 && row[vehicleNumberIdx] ? row[vehicleNumberIdx].trim().toUpperCase() : null;
      let vehicleTypeStr = vehicleTypeIdx !== -1 && row[vehicleTypeIdx] ? row[vehicleTypeIdx].trim() : null;
      let serviceOptedStr = serviceOptedIdx !== -1 && row[serviceOptedIdx] ? row[serviceOptedIdx].trim() : null;
      const addonServicesStr = addonServicesIdx !== -1 && row[addonServicesIdx] ? row[addonServicesIdx].trim() : null;
      const assignedEmployeeStr = assignedEmployeeIdx !== -1 && row[assignedEmployeeIdx] ? row[assignedEmployeeIdx].trim() : null;
      const discountAmountVal = discountAmountIdx !== -1 && row[discountAmountIdx] ? parseInt(row[discountAmountIdx].replace(/[^0-9.]/g, ""), 10) || 0 : 0;
      const notesStr = notesIdx !== -1 && row[notesIdx] ? row[notesIdx].trim() : null;
      const timeStr = timeIdx !== -1 && row[timeIdx] ? row[timeIdx].trim() : null;
      const invoiceIdVal = invoiceIdIdx !== -1 && row[invoiceIdIdx] ? row[invoiceIdIdx].trim() : null;

      // Check for deduplication
      const currentSignature = `${normalizedDateStr}|${parsedAmount}|${paymentModeStr.toLowerCase()}|${(vehicleNumberStr || "").toLowerCase()}|${(customerNameStr || "").toLowerCase()}`;
      if (existingSignatures.has(currentSignature) || (invoiceIdVal && existingSignatures.has(`inv:${invoiceIdVal.toLowerCase()}`))) {
        skippedCount++;
        continue;
      }

      // Auto-detect service and vehicle type from amount if missing
      if (!serviceOptedStr || !vehicleTypeStr) {
        const match = await matchServiceWithPrice(parsedAmount);
        if (match) {
          if (!serviceOptedStr) serviceOptedStr = match.serviceOpted;
          if (!vehicleTypeStr) vehicleTypeStr = match.vehicleType;
        }
      }

      const finalAmount = parsedAmount - discountAmountVal;

      newTransactionsData.push({
        date: normalizedDateStr,
        amount: parsedAmount,
        paymentMode: paymentModeStr || "Cash",
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
        notes: notesStr ? `[Google Sheets Auto-Sync] ${notesStr}` : "[Google Sheets Auto-Sync]",
        createdBy: "Google Sheet Sync",
      });

      // Mark signature as used so within-sheet duplicates are also skipped
      existingSignatures.add(currentSignature);
      if (invoiceIdVal) {
        existingSignatures.add(`inv:${invoiceIdVal.toLowerCase()}`);
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
      message: `Sync complete! ${addedCount} new transactions added, ${skippedCount} duplicate/empty rows skipped.`,
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
