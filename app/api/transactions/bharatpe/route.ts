import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/apiAuth";

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

// Normalize date to YYYY-MM-DD
function normalizeDateStr(rawDate: string): string | null {
  if (!rawDate) return null;
  const clean = rawDate.trim().replace(/"/g, "");

  // Match ISO YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = String(isoMatch[2]).padStart(2, "0");
    const d = String(isoMatch[3]).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // Match DD-MM-YYYY or DD/MM/YYYY
  const ddmmyyyy = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (ddmmyyyy) {
    const d = String(ddmmyyyy[1]).padStart(2, "0");
    const m = String(ddmmyyyy[2]).padStart(2, "0");
    const y = ddmmyyyy[3];
    return `${y}-${m}-${d}`;
  }

  // Fallback JS Date parser
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return null;
}

// Clean amount from strings like "₹ 250.00" or "250"
function parseAmount(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return Math.round(val);
  const clean = String(val).replace(/[^0-9.]/g, "");
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.round(num);
}

// Extract column indices from header row flexibly
function detectColumns(headerRow: string[]) {
  const normalized = headerRow.map((h) => h.toLowerCase().trim().replace(/[^a-z0-9]/g, ""));

  const findCol = (keywords: string[]) => {
    for (let i = 0; i < normalized.length; i++) {
      const h = normalized[i];
      if (keywords.some((k) => h === k || h.includes(k))) return i;
    }
    return -1;
  };

  return {
    dateIdx: findCol(["date", "transactiondate", "paymentdate", "timestamp", "datetime", "createdat", "time"]),
    amountIdx: findCol(["amount", "netamount", "grossamount", "transactionamount", "paidamount", "total"]),
    payerNameIdx: findCol(["payername", "customername", "sendername", "paidby", "from", "payer", "name", "customer", "vpa", "upiid"]),
    utrIdx: findCol(["utr", "bankreferenceno", "transactionid", "referenceid", "txnid", "paymentid", "bankref", "refno", "orderid", "rrn"]),
    statusIdx: findCol(["status", "transactionstatus", "paymentstatus"]),
    phoneIdx: findCol(["phone", "mobile", "customermobile", "senderphone", "contact"]),
  };
}

export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { csvContent, action = "preview", importUnmatched = false } = body;

    if (!csvContent || typeof csvContent !== "string") {
      return NextResponse.json({ success: false, message: "No CSV content provided." }, { status: 400 });
    }

    const rows = parseCsvContent(csvContent);
    if (rows.length < 2) {
      return NextResponse.json({ success: false, message: "CSV file is empty or missing data rows." }, { status: 400 });
    }

    const header = rows[0];
    const cols = detectColumns(header);

    if (cols.dateIdx === -1 && cols.amountIdx === -1) {
      return NextResponse.json(
        {
          success: false,
          message: "Could not automatically detect Date and Amount columns in the CSV. Please ensure standard BharatPe headers.",
        },
        { status: 400 }
      );
    }

    // Read all existing transactions to match against
    const existingTransactions = await prisma.transaction.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    // Extract all recorded UTRs to ensure strict idempotency (0 duplicates)
    const recordedUtrs = new Set<string>();
    existingTransactions.forEach((tx) => {
      const notes = (tx.notes || "").toUpperCase();
      const invoiceId = (tx.invoiceId || "").toUpperCase();
      const utrMatches = `${notes} ${invoiceId}`.match(/\b([A-Z0-9]{8,30})\b/g);
      if (utrMatches) {
        utrMatches.forEach((u) => recordedUtrs.add(u));
      }
    });

    // Pool of eligible existing transactions for matching (UPI mode on same date + amount)
    const availableTxMap: Record<string, typeof existingTransactions> = {};
    existingTransactions.forEach((tx) => {
      const key = `${tx.date}_${tx.finalAmount ?? tx.amount}`;
      if (!availableTxMap[key]) availableTxMap[key] = [];
      availableTxMap[key].push(tx);
    });

    const matchedItems: any[] = [];
    const alreadySyncedItems: any[] = [];
    const unmatchedItems: any[] = [];
    const skippedItems: any[] = [];

    const pairedTxIds = new Set<string>();

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length === 0 || row.every((c) => c === "")) continue;

      const rawDate = cols.dateIdx !== -1 ? row[cols.dateIdx] : "";
      const date = normalizeDateStr(rawDate);
      const amount = cols.amountIdx !== -1 ? parseAmount(row[cols.amountIdx]) : 0;
      const payerName = cols.payerNameIdx !== -1 ? (row[cols.payerNameIdx] || "").trim().toUpperCase() : "UPI CUSTOMER";
      const utr = cols.utrIdx !== -1 ? (row[cols.utrIdx] || "").trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : "";
      const status = cols.statusIdx !== -1 ? (row[cols.statusIdx] || "").trim().toUpperCase() : "SUCCESS";
      const phone = cols.phoneIdx !== -1 ? (row[cols.phoneIdx] || "").trim() : "";

      // Skip non-successful transactions
      if (status && (status.includes("FAIL") || status.includes("CANCEL") || status.includes("REJECT") || status.includes("BOUNCE"))) {
        skippedItems.push({ rowNumber: i + 1, date, amount, payerName, utr, reason: `Status: ${status}` });
        continue;
      }

      if (!date || amount <= 0) {
        skippedItems.push({ rowNumber: i + 1, date: rawDate, amount, payerName, reason: "Invalid Date or 0 Amount" });
        continue;
      }

      // Check 1: Is this UTR already synced in database?
      if (utr && recordedUtrs.has(utr)) {
        alreadySyncedItems.push({
          rowNumber: i + 1,
          date,
          amount,
          payerName,
          utr,
          status: "ALREADY_SYNCED",
        });
        continue;
      }

      // Check 2: Try to match with an existing manual transaction on same Date + Amount
      const key = `${date}_${amount}`;
      const candidates = availableTxMap[key] || [];

      // Prioritize candidate without a customer name or marked as UPI
      const candidate = candidates.find((tx) => {
        if (pairedTxIds.has(tx.id)) return false;
        const txMode = (tx.paymentMode || "").toUpperCase();
        return txMode === "UPI" || txMode === "" || txMode === "CASH";
      });

      if (candidate) {
        pairedTxIds.add(candidate.id);
        if (utr) recordedUtrs.add(utr);

        matchedItems.push({
          rowNumber: i + 1,
          transactionId: candidate.id,
          invoiceId: candidate.invoiceId,
          date,
          amount,
          existingCustomer: candidate.customerName || "None",
          newPayerName: payerName,
          vehicleNumber: candidate.vehicleNumber || "N/A",
          serviceOpted: candidate.serviceOpted || "General Wash",
          utr,
          status: "MATCHED_ENRICH",
        });
      } else {
        unmatchedItems.push({
          rowNumber: i + 1,
          date,
          amount,
          payerName,
          utr,
          phone,
          status: "UNMATCHED_NEW",
        });
      }
    }

    // If COMMIT mode, execute the enrichment in database
    if (action === "commit") {
      let enrichedCount = 0;
      let newCreatedCount = 0;

      // 1. Enrich matched records
      for (const m of matchedItems) {
        const existingTx = existingTransactions.find((t) => t.id === m.transactionId);
        if (!existingTx) continue;

        const currentNotes = existingTx.notes || "";
        const utrNote = m.utr ? `BharatPe UTR: ${m.utr}` : "BharatPe UPI Reconciled";
        const updatedNotes = currentNotes.includes("BharatPe") ? currentNotes : currentNotes ? `${currentNotes} | ${utrNote}` : utrNote;

        await prisma.transaction.update({
          where: { id: m.transactionId },
          data: {
            customerName: m.newPayerName || existingTx.customerName,
            paymentMode: "UPI",
            notes: updatedNotes,
          },
        });

        // Also register/update in Customer table if name exists
        if (m.newPayerName && m.newPayerName !== "UPI CUSTOMER") {
          try {
            const existingCust = await prisma.customer.findFirst({
              where: { customerName: m.newPayerName },
            });
            if (existingCust) {
              await prisma.customer.update({
                where: { id: existingCust.id },
                data: {
                  totalVisits: { increment: 1 },
                  totalSpent: { increment: m.amount },
                },
              });
            } else {
              await prisma.customer.create({
                data: {
                  customerName: m.newPayerName,
                  totalVisits: 1,
                  totalSpent: m.amount,
                  primaryCategory: "NEW",
                },
              });
            }
          } catch {}
        }

        enrichedCount++;
      }

      // 2. Optionally insert unrecorded new payments
      if (importUnmatched && unmatchedItems.length > 0) {
        for (const u of unmatchedItems) {
          const newInvoiceId = `BP-${u.date.replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
          const utrNote = u.utr ? `BharatPe UTR: ${u.utr}` : "BharatPe UPI Verified";

          await prisma.transaction.create({
            data: {
              date: u.date,
              amount: u.amount,
              finalAmount: u.amount,
              paymentMode: "UPI",
              customerName: u.payerName,
              customerMobile: u.phone || null,
              serviceOpted: "Walk-in UPI Wash",
              invoiceId: newInvoiceId,
              notes: utrNote,
              createdBy: "BharatPe Reconciler",
            },
          });
          newCreatedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully reconciled! Enriched ${enrichedCount} existing washes with customer names. Skipped ${alreadySyncedItems.length} duplicate rows. Created ${newCreatedCount} new transactions.`,
        enrichedCount,
        alreadySyncedCount: alreadySyncedItems.length,
        newCreatedCount,
      });
    }

    // PREVIEW MODE RESPONSE
    return NextResponse.json({
      success: true,
      summary: {
        totalRows: rows.length - 1,
        matchedCount: matchedItems.length,
        alreadySyncedCount: alreadySyncedItems.length,
        unmatchedCount: unmatchedItems.length,
        skippedCount: skippedItems.length,
      },
      matchedItems: matchedItems.slice(0, 50),
      alreadySyncedItems: alreadySyncedItems.slice(0, 20),
      unmatchedItems: unmatchedItems.slice(0, 30),
      skippedItems: skippedItems.slice(0, 10),
    });
  } catch (error: any) {
    console.error("BharatPe reconciliation error:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to reconcile BharatPe CSV." }, { status: 500 });
  }
}
