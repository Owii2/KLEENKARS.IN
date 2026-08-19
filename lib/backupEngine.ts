import { prisma } from "./prisma";
import nodemailer from "nodemailer";

// Helper to escape CSV cell content safely
export function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return "";
  const s = String(val).trim();
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export interface BackupFileInfo {
  filename: string;
  category: string;
  recordCount: number;
  csvContent: string;
}

export interface MonthlyBackupResult {
  monthLabel: string;
  monthQuery: string | null;
  files: BackupFileInfo[];
  summary: {
    totalSales: number;
    salesCount: number;
    totalExpenses: number;
    expensesCount: number;
    totalBookingsCost: number;
    bookingsCount: number;
    attendanceCount: number;
    employeesCount: number;
    customersCount: number;
    netProfit: number;
  };
}

export async function generateMonthlyCsvBackups(monthStr?: string): Promise<MonthlyBackupResult> {
  // If monthStr is provided (e.g. "2026-08" or "2026-07"), filter by that month.
  // If monthStr is "all" or undefined, fetch all available data.
  const isAllTime = !monthStr || monthStr.toLowerCase() === "all";
  const targetMonth = isAllTime ? null : monthStr.trim();
  const monthLabel = targetMonth ? `Month_${targetMonth}` : "All_Time";

  // 1. SALES TRANSACTIONS
  const txWhere: any = {};
  if (targetMonth) {
    txWhere.date = { startsWith: targetMonth };
  }
  const transactions = await prisma.transaction.findMany({
    where: txWhere,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  const salesHeaders = [
    "Invoice ID",
    "Date",
    "Time",
    "Customer Name",
    "Customer Phone",
    "Vehicle Number",
    "Vehicle Type",
    "Service Opted",
    "Addon Services",
    "Amount",
    "Discount",
    "Final Amount",
    "Payment Mode",
    "Staff Assigned",
    "Notes",
    "Created By",
    "Created At",
  ];

  const salesRows = transactions.map((t) => [
    t.invoiceId || t.id,
    t.date,
    t.time || "",
    t.customerName || "",
    t.customerMobile || "",
    t.vehicleNumber || "",
    t.vehicleType || "",
    t.serviceOpted || "",
    t.addonServices || "",
    t.amount,
    t.discountAmount || 0,
    t.finalAmount ?? t.amount,
    t.paymentMode || "CASH",
    t.assignedEmployee || "",
    t.notes || "",
    t.createdBy || "System",
    t.createdAt.toISOString(),
  ]);

  const salesCsv = [
    salesHeaders.map(escapeCsvCell).join(","),
    ...salesRows.map((r) => r.map(escapeCsvCell).join(",")),
  ].join("\r\n");

  // 2. BOOKINGS
  const bookingWhere: any = {};
  if (targetMonth) {
    bookingWhere.bookingDate = { startsWith: targetMonth };
  }
  const bookings = await prisma.booking.findMany({
    where: bookingWhere,
    orderBy: [{ bookingDate: "desc" }, { createdAt: "desc" }],
  });

  const bookingHeaders = [
    "Booking ID",
    "Booking Date",
    "Booking Time",
    "Customer Name",
    "Customer Phone",
    "Customer Email",
    "Total Cost",
    "Discount",
    "Final Amount",
    "Payment Mode",
    "Status",
    "Doorstep Pickup",
    "Assigned Staff",
    "Referral Code",
    "Notes",
    "Created At",
  ];

  const bookingRows = bookings.map((b) => [
    b.id,
    b.bookingDate,
    b.bookingTime,
    b.customerName,
    b.phoneNumber,
    b.email || "",
    b.totalCost,
    b.discount || 0,
    b.finalAmount ?? b.totalCost,
    b.paymentMode || "Cash",
    b.status,
    b.pickupDrop ? "Yes" : "No",
    b.assignedEmployeeName || b.assignedTo || "",
    b.referralCode || "",
    b.notes || "",
    b.createdAt.toISOString(),
  ]);

  const bookingsCsv = [
    bookingHeaders.map(escapeCsvCell).join(","),
    ...bookingRows.map((r) => r.map(escapeCsvCell).join(",")),
  ].join("\r\n");

  // 3. ATTENDANCE
  let attendanceWhere: any = {};
  if (targetMonth) {
    // Check-in dates in this month
    const [yearStr, monthNumStr] = targetMonth.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthNumStr, 10);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    attendanceWhere = {
      checkIn: {
        gte: startDate,
        lt: endDate,
      },
    };
  }
  const attendanceList = await prisma.attendance.findMany({
    where: attendanceWhere,
    orderBy: [{ checkIn: "desc" }],
  });

  const attendanceHeaders = [
    "Attendance ID",
    "Employee Code",
    "Employee Name",
    "Check In Time",
    "Check Out Time",
    "Status",
    "Notes",
  ];

  const attendanceRows = attendanceList.map((a) => [
    a.id,
    a.employeeCode,
    a.employeeName,
    a.checkIn.toISOString(),
    a.checkOut ? a.checkOut.toISOString() : "",
    a.attendanceStatus,
    a.notes || "",
  ]);

  const attendanceCsv = [
    attendanceHeaders.map(escapeCsvCell).join(","),
    ...attendanceRows.map((r) => r.map(escapeCsvCell).join(",")),
  ].join("\r\n");

  // 4. EXPENSES
  let expenseWhere: any = {};
  if (targetMonth) {
    const [yearStr, monthNumStr] = targetMonth.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthNumStr, 10);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    expenseWhere = {
      date: {
        gte: startDate,
        lt: endDate,
      },
    };
  }
  const expenses = await prisma.expense.findMany({
    where: expenseWhere,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  const expenseHeaders = [
    "Expense ID",
    "Date",
    "Category",
    "Amount",
    "Payment Mode",
    "Paid To / Vendor",
    "Description",
    "Invoice Number",
    "Branch",
    "Created By",
    "Notes",
    "Created At",
  ];

  const expenseRows = expenses.map((e) => [
    e.id,
    e.date.toISOString().split("T")[0],
    e.category || "General",
    e.amount,
    e.paymentMode || "Cash",
    e.paidTo || "",
    e.description || "",
    e.invoiceNumber || "",
    e.branch || "",
    e.createdBy || "Admin",
    e.notes || "",
    e.createdAt.toISOString(),
  ]);

  const expensesCsv = [
    expenseHeaders.map(escapeCsvCell).join(","),
    ...expenseRows.map((r) => r.map(escapeCsvCell).join(",")),
  ].join("\r\n");

  // 5. DAILY CLOSING
  const closingWhere: any = {};
  if (targetMonth) {
    closingWhere.date = { startsWith: targetMonth };
  }
  const dailyClosings = await prisma.dailyClosing.findMany({
    where: closingWhere,
    orderBy: [{ date: "desc" }],
  });

  const closingHeaders = [
    "Closing Date",
    "Total Bookings",
    "Cash Revenue",
    "UPI Revenue",
    "Total Revenue",
    "Total Expenses",
    "Cash Closing After Expenses",
    "Net Profit",
  ];

  const closingRows = dailyClosings.map((c) => [
    c.date,
    c.totalBookings,
    c.cashRevenue,
    c.upiRevenue,
    c.totalRevenue,
    c.totalExpenses,
    c.cashClosingAfterExpenses ?? 0,
    c.netProfit,
  ]);

  const closingCsv = [
    closingHeaders.map(escapeCsvCell).join(","),
    ...closingRows.map((r) => r.map(escapeCsvCell).join(",")),
  ].join("\r\n");

  // 6. EMPLOYEES MASTER
  const employees = await prisma.employee.findMany({
    orderBy: { name: "asc" },
  });
  const employeeHeaders = [
    "Employee Code",
    "Name",
    "Role",
    "Phone Number",
    "Email",
    "Salary Per Day",
    "Status",
    "Branch",
    "Shift Type",
    "Joining Date",
  ];
  const employeeRows = employees.map((emp) => [
    emp.employeeCode,
    emp.name,
    emp.role,
    emp.phoneNumber,
    emp.email || "",
    emp.salaryPerDay,
    emp.status,
    emp.branch || "",
    emp.shiftType || "",
    emp.joiningDate.toISOString().split("T")[0],
  ]);
  const employeesCsv = [
    employeeHeaders.map(escapeCsvCell).join(","),
    ...employeeRows.map((r) => r.map(escapeCsvCell).join(",")),
  ].join("\r\n");

  // 7. CUSTOMERS MASTER
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
  });
  const customerHeaders = [
    "Customer ID",
    "Name",
    "Phone Number",
    "Email",
    "Total Visits",
    "Total Spent",
    "Category",
    "Referral Code",
    "Referral Points",
  ];
  const customerRows = customers.map((c) => [
    c.id,
    c.customerName || "",
    c.phoneNumber || "",
    c.email || "",
    c.totalVisits,
    c.totalSpent,
    c.primaryCategory || "NEW",
    c.referralCode || "",
    c.referralPoints,
  ]);
  const customersCsv = [
    customerHeaders.map(escapeCsvCell).join(","),
    ...customerRows.map((r) => r.map(escapeCsvCell).join(",")),
  ].join("\r\n");

  // Files package
  const files: BackupFileInfo[] = [
    {
      filename: `Sales_Transactions_${monthLabel}.csv`,
      category: "Sales Transactions",
      recordCount: transactions.length,
      csvContent: salesCsv,
    },
    {
      filename: `Bookings_${monthLabel}.csv`,
      category: "Online Bookings",
      recordCount: bookings.length,
      csvContent: bookingsCsv,
    },
    {
      filename: `Attendance_${monthLabel}.csv`,
      category: "Staff Attendance",
      recordCount: attendanceList.length,
      csvContent: attendanceCsv,
    },
    {
      filename: `Expenses_${monthLabel}.csv`,
      category: "Expenses",
      recordCount: expenses.length,
      csvContent: expensesCsv,
    },
    {
      filename: `Daily_Closing_${monthLabel}.csv`,
      category: "Daily Closing Records",
      recordCount: dailyClosings.length,
      csvContent: closingCsv,
    },
    {
      filename: `Employees_Master_${monthLabel}.csv`,
      category: "Employees Master",
      recordCount: employees.length,
      csvContent: employeesCsv,
    },
    {
      filename: `Customers_Master_${monthLabel}.csv`,
      category: "Customers Master",
      recordCount: customers.length,
      csvContent: customersCsv,
    },
  ];

  // Calculate summary statistics
  const totalSales = transactions.reduce((sum, t) => sum + (t.finalAmount ?? t.amount ?? 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalBookingsCost = bookings.reduce((sum, b) => sum + (b.finalAmount ?? b.totalCost ?? 0), 0);
  const netProfit = totalSales - totalExpenses;

  return {
    monthLabel: targetMonth || "All Time",
    monthQuery: targetMonth,
    files,
    summary: {
      totalSales,
      salesCount: transactions.length,
      totalExpenses,
      expensesCount: expenses.length,
      totalBookingsCost,
      bookingsCount: bookings.length,
      attendanceCount: attendanceList.length,
      employeesCount: employees.length,
      customersCount: customers.length,
      netProfit,
    },
  };
}

export async function sendMonthlyBackupEmail(options?: {
  month?: string;
  recipientEmail?: string;
  triggeredBy?: string;
}) {
  const recipient = options?.recipientEmail || process.env.NOTIFICATION_EMAIL || "owii.rajput@gmail.com";
  const backupData = await generateMonthlyCsvBackups(options?.month);

  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error("SMTP credentials are not configured in environment variables.");
  }

  // Create email attachments with each separate CSV file
  const attachments = backupData.files.map((file) => ({
    filename: file.filename,
    content: Buffer.from(file.csvContent, "utf-8"),
    contentType: "text/csv; charset=utf-8",
  }));

  const timeFormatted = new Date().toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "medium",
  });

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; background-color: #050507; color: #ffffff; padding: 28px; border-radius: 16px; border: 1px solid #27272a;">
      <div style="border-bottom: 2px solid #ef4444; padding-bottom: 16px; margin-bottom: 24px;">
        <h2 style="color: #ef4444; margin: 0; font-size: 24px;">📊 Kleenkars Monthly Data Backup (${backupData.monthLabel})</h2>
        <p style="color: #a1a1aa; font-size: 13px; margin-top: 4px;">Automated CSV Data Export • Kleenkars Studio</p>
      </div>

      <p style="color: #d4d4d8; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
        Hello, here is your complete monthly data backup package for <strong>${backupData.monthLabel}</strong>. 
        All datasets have been packaged into separate CSV files attached to this email.
      </p>

      <div style="background-color: #12121a; padding: 18px; border-radius: 12px; border: 1px solid #27272a; margin-bottom: 24px;">
        <h3 style="color: #10b981; margin: 0 0 12px 0; font-size: 16px;">📈 Monthly Summary (${backupData.monthLabel})</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #a1a1aa;">Total Sales Revenue:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #10b981;">₹${backupData.summary.totalSales.toLocaleString("en-IN")} (${backupData.summary.salesCount} txns)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #a1a1aa;">Total Expenses:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #ef4444;">₹${backupData.summary.totalExpenses.toLocaleString("en-IN")} (${backupData.summary.expensesCount} bills)</td>
          </tr>
          <tr style="border-top: 1px solid #27272a;">
            <td style="padding: 8px 0; font-weight: bold; color: #ffffff;">Estimated Net Profit:</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right; color: ${backupData.summary.netProfit >= 0 ? '#10b981' : '#ef4444'}; font-size: 15px;">₹${backupData.summary.netProfit.toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #a1a1aa;">Online Bookings:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #ffffff;">${backupData.summary.bookingsCount} bookings (₹${backupData.summary.totalBookingsCost.toLocaleString("en-IN")})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #a1a1aa;">Staff Attendance Logged:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #ffffff;">${backupData.summary.attendanceCount} check-ins</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 24px;">
        <h4 style="color: #ffffff; font-size: 14px; margin-bottom: 12px;">📁 Attached CSV Backup Files (${attachments.length} files):</h4>
        <ul style="list-style: none; padding: 0; margin: 0; font-size: 13px;">
          ${backupData.files
            .map(
              (f) => `
            <li style="padding: 8px 12px; margin-bottom: 6px; background-color: #18181b; border-radius: 8px; border-left: 3px solid #10b981; display: flex; justify-content: space-between;">
              <span style="color: #ffffff; font-family: monospace;">📄 ${f.filename}</span>
              <span style="color: #a1a1aa; font-size: 12px;">(${f.recordCount} rows)</span>
            </li>`
            )
            .join("")}
        </ul>
      </div>

      <div style="font-size: 12px; color: #71717a; border-top: 1px solid #27272a; padding-top: 14px; text-align: center;">
        Dispatched automatically on ${timeFormatted} • Kleenkars Backup Engine
      </div>
    </div>
  `;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || `"Kleenkars Backup Engine" <${smtpUser}>`,
    to: recipient,
    subject: `📦 [Data Backup] Kleenkars CSV Exports for ${backupData.monthLabel} (${attachments.length} CSVs)`,
    html: htmlBody,
    attachments,
  };

  const info: any = await transporter.sendMail(mailOptions);
  console.log(`Monthly backup email sent to ${recipient}. MessageId: ${info.messageId}`);

  return {
    success: true,
    messageId: info.messageId,
    recipient,
    monthLabel: backupData.monthLabel,
    attachedFiles: backupData.files.map((f) => ({ name: f.filename, records: f.recordCount })),
    summary: backupData.summary,
  };
}
