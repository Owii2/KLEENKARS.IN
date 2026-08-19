import { prisma } from "./prisma";

export interface TransactionPayload {
  id?: string;
  date: string;
  amount: number;
  paymentMode: string;
  time?: string | null;
  customerName?: string | null;
  customerMobile?: string | null;
  vehicleNumber?: string | null;
  vehicleType?: string | null;
  serviceOpted?: string | null;
  addonServices?: string | null;
  assignedEmployee?: string | null;
  discountAmount?: number | null;
  notes?: string | null;
  invoiceId?: string | null;
}

// Push a newly created transaction row directly to Google Sheet via Webhook
export async function pushTransactionToGoogleSheet(tx: TransactionPayload) {
  try {
    const [webhookSetting, sheetNameSetting] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: "google_sheet_webhook_url" } }),
      prisma.systemSetting.findUnique({ where: { key: "google_sheet_transactions_sheet_name" } }),
    ]);

    const webhookUrl = webhookSetting?.value || process.env.GOOGLE_SHEET_WEBHOOK_URL || "";
    if (!webhookUrl.trim()) {
      return { success: false, reason: "Google Sheet Webhook URL not configured" };
    }

    const sheetName = sheetNameSetting?.value || "";

    // Ensure all text values are converted to UPPERCASE
    const payload = {
      action: "append",
      sheetName: sheetName.trim() || undefined,
      row: {
        date: tx.date,
        time: tx.time || "",
        amount: tx.amount,
        paymentMode: (tx.paymentMode || "CASH").toUpperCase(),
        customerName: tx.customerName ? tx.customerName.toUpperCase() : "",
        customerMobile: tx.customerMobile || "",
        vehicleNumber: tx.vehicleNumber ? tx.vehicleNumber.toUpperCase() : "",
        vehicleType: tx.vehicleType ? tx.vehicleType.toUpperCase() : "",
        serviceOpted: tx.serviceOpted ? tx.serviceOpted.toUpperCase() : "",
        addonServices: tx.addonServices ? tx.addonServices.toUpperCase() : "",
        assignedEmployee: tx.assignedEmployee ? tx.assignedEmployee.toUpperCase() : "",
        discountAmount: tx.discountAmount || 0,
        notes: tx.notes ? tx.notes.toUpperCase() : "WEB APP ENTRY",
        invoiceId: tx.invoiceId ? tx.invoiceId.toUpperCase() : "",
      },
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      console.log(`Transaction successfully pushed to Google Sheet! Ref: ${tx.invoiceId || tx.id}`);
      return { success: true };
    } else {
      console.error(`Failed to push transaction to Google Sheet. Status: ${res.status}`);
      return { success: false, status: res.status };
    }
  } catch (err) {
    console.error("Error pushing transaction to Google Sheet Webhook:", err);
    return { success: false, error: err };
  }
}

// Clean up duplicate transactions in database and keep only the cleanest entries
export async function cleanupDuplicateTransactions(keepOnlyGoogleSheet = false) {
  const transactions = await prisma.transaction.findMany({
    orderBy: [
      { createdAt: "desc" }
    ],
  });

  const seenSignatures = new Map<string, string>(); // signature -> id to keep
  const duplicateIdsToDelete: string[] = [];

  for (const tx of transactions) {
    // If keepOnlyGoogleSheet is true, delete non-google sheet transactions
    if (keepOnlyGoogleSheet && tx.createdBy !== "Google Sheet Sync" && tx.createdBy !== "GOOGLE SHEET SYNC") {
      duplicateIdsToDelete.push(tx.id);
      continue;
    }

    const normDate = tx.date;
    const normAmount = tx.amount;
    const normPayment = (tx.paymentMode || "").toUpperCase();
    const normVehicle = (tx.vehicleNumber || "").toUpperCase();
    const normCustomer = (tx.customerName || "").toUpperCase();

    const signature = `${normDate}|${normAmount}|${normPayment}|${normVehicle}|${normCustomer}`;

    if (seenSignatures.has(signature)) {
      duplicateIdsToDelete.push(tx.id);
    } else {
      seenSignatures.set(signature, tx.id);
    }
  }

  let deletedCount = 0;
  if (duplicateIdsToDelete.length > 0) {
    // Delete in chunks of 500
    for (let i = 0; i < duplicateIdsToDelete.length; i += 500) {
      const chunk = duplicateIdsToDelete.slice(i, i + 500);
      const res = await prisma.transaction.deleteMany({
        where: {
          id: {
            in: chunk,
          },
        },
      });
      deletedCount += res.count;
    }
  }

  return {
    success: true,
    totalEvaluated: transactions.length,
    deletedCount,
    remainingCount: transactions.length - deletedCount,
  };
}
