import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/apiAuth";

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

function extractSheetId(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

function cleanUpper(val: any): string | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (s.length === 0 || s === "." || s === "-" || s === "--" || s.toLowerCase() === "n/a" || s.toLowerCase() === "na" || s.toLowerCase() === "null" || s.toLowerCase() === "none") {
    return null;
  }
  return s.toUpperCase();
}

function parseMonthString(rawMonth: string): { year: number; month: number; monthKey: string } | null {
  if (!rawMonth) return null;
  const cleaned = rawMonth.trim().replace(/\//g, "-").replace(/\./g, "-");

  // Format: M-D-YYYY or MM-DD-YYYY
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(cleaned)) {
    const [m, , y] = cleaned.split("-");
    const monthNum = parseInt(m, 10);
    const yearNum = parseInt(y, 10);
    return {
      year: yearNum,
      month: monthNum,
      monthKey: `${yearNum}-${String(monthNum).padStart(2, "0")}`,
    };
  }

  // Format: M/D/YYYY or MM/DD/YYYY
  if (cleaned.includes("/")) {
    const parts = cleaned.split("/");
    const m = parseInt(parts[0], 10);
    const yr = parseInt(parts[2] || "2026", 10);
    if (!isNaN(m) && !isNaN(yr)) {
      return {
        year: yr,
        month: m,
        monthKey: `${yr}-${String(m).padStart(2, "0")}`,
      };
    }
  }

  // Format: YYYY-MM or YYYY-MM-DD
  if (/^\d{4}-\d{1,2}/.test(cleaned)) {
    const [y, m] = cleaned.split("-");
    const monthNum = parseInt(m, 10);
    const yearNum = parseInt(y, 10);
    return {
      year: yearNum,
      month: monthNum,
      monthKey: `${yearNum}-${String(monthNum).padStart(2, "0")}`,
    };
  }

  return null;
}

export async function GET(req: Request) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    let googleSheetUrl = searchParams.get("url") || "";
    const sheetName = searchParams.get("sheet") || "Attendance";

    if (!googleSheetUrl) {
      const setting = await prisma.systemSetting.findUnique({ where: { key: "google_sheet_attendance_url" } });
      if (setting && setting.value) googleSheetUrl = setting.value;
    }

    if (!googleSheetUrl) {
      googleSheetUrl = "https://docs.google.com/spreadsheets/d/1G1vI5n7QifWB778D5d37wrRZqlZjcLUlxtCb9gUtPWc/edit?usp=sharing";
    }

    const sheetId = extractSheetId(googleSheetUrl);
    const csvUrl = sheetId
      ? `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
      : googleSheetUrl;

    const response = await fetch(csvUrl, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `Unable to access Google Sheet '${sheetName}' (HTTP ${response.status}). Ensure sheet is shared with 'Anyone with the link can view'.`,
        },
        { status: 400 }
      );
    }

    const csvText = await response.text();
    const rows = parseCsvContent(csvText);

    if (rows.length < 2) {
      return NextResponse.json(
        { success: false, message: `Sheet '${sheetName}' contains no data.` },
        { status: 400 }
      );
    }

    const headers = rows[0];
    const employeeRows: any[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const empId = cleanUpper(row[0]);
      const empName = cleanUpper(row[1]);
      const rawMonth = row[2];
      if (!empId && !empName) continue;

      const parsedMonth = parseMonthString(rawMonth);
      const monthlySalary = parseInt(String(row[3] || "").replace(/[^0-9]/g, ""), 10) || 0;
      const phone = String(row[4] || "").trim();
      const presentDays = parseInt(String(row[36] || "").replace(/[^0-9]/g, ""), 10) || 0;
      const halfDays = parseInt(String(row[37] || "").replace(/[^0-9]/g, ""), 10) || 0;
      const absentDays = parseInt(String(row[38] || "").replace(/[^0-9]/g, ""), 10) || 0;
      const finalSalary = parseInt(String(row[39] || "").replace(/[^0-9]/g, ""), 10) || 0;
      const advanceGiven = parseInt(String(row[40] || "").replace(/[^0-9]/g, ""), 10) || 0;
      const netPayable = parseInt(String(row[41] || "").replace(/[^0-9]/g, ""), 10) || 0;
      const deductibleDays = parseInt(String(row[42] || "").replace(/[^0-9]/g, ""), 10) || 0;
      const carsWashed = parseInt(String(row[43] || "").replace(/[^0-9]/g, ""), 10) || 0;
      const upsells = parseInt(String(row[44] || "").replace(/[^0-9]/g, ""), 10) || 0;
      const remarks = cleanUpper(row[45]);

      // Extract daily statuses 1..31
      const dailyCheckins: Record<number, string> = {};
      for (let day = 1; day <= 31; day++) {
        const colIdx = 4 + day; // 1 is at index 5
        const status = cleanUpper(row[colIdx]);
        if (status) dailyCheckins[day] = status;
      }

      employeeRows.push({
        rowNumber: r + 1,
        empId,
        empName,
        rawMonth,
        monthKey: parsedMonth?.monthKey || rawMonth,
        monthlySalary,
        phone,
        presentDays,
        halfDays,
        absentDays,
        finalSalary,
        advanceGiven,
        netPayable,
        deductibleDays,
        carsWashed,
        upsells,
        remarks,
        dailyCheckinsCount: Object.keys(dailyCheckins).length,
      });
    }

    return NextResponse.json({
      success: true,
      headers,
      totalRows: employeeRows.length,
      employees: employeeRows,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to preview attendance sheet" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    let {
      googleSheetUrl = "https://docs.google.com/spreadsheets/d/1G1vI5n7QifWB778D5d37wrRZqlZjcLUlxtCb9gUtPWc/edit?usp=sharing",
      sheetName = "Attendance",
    } = body;

    const sheetId = extractSheetId(googleSheetUrl);
    const csvUrl = sheetId
      ? `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
      : googleSheetUrl;

    const response = await fetch(csvUrl, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: `Unable to access Google Sheet (HTTP ${response.status}).` },
        { status: 400 }
      );
    }

    const csvText = await response.text();
    const rows = parseCsvContent(csvText);

    if (rows.length < 2) {
      return NextResponse.json(
        { success: false, message: `Sheet '${sheetName}' contains no data.` },
        { status: 400 }
      );
    }

    // Save default setting
    await prisma.systemSetting.upsert({
      where: { key: "google_sheet_attendance_url" },
      update: { value: googleSheetUrl },
      create: { key: "google_sheet_attendance_url", value: googleSheetUrl },
    });

    let totalAttendanceInserted = 0;
    let totalPayrollUpserted = 0;
    let totalEmployeesSynced = 0;

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const empId = cleanUpper(row[0]);
      const empName = cleanUpper(row[1]);
      const rawMonth = row[2];
      if (!empId && !empName) continue;

      const parsedMonth = parseMonthString(rawMonth);
      if (!parsedMonth) continue;

      const monthlySalary = parseInt(String(row[3] || "").replace(/[^0-9]/g, ""), 10) || 0;
      const phone = String(row[4] || "").trim();
      const presentDays = parseInt(String(row[36] || "").replace(/[^0-9]/g, ""), 10) || 0;
      const halfDays = parseInt(String(row[37] || "").replace(/[^0-9]/g, ""), 10) || 0;
      const absentDays = parseInt(String(row[38] || "").replace(/[^0-9]/g, ""), 10) || 0;
      const finalSalary = parseInt(String(row[39] || "").replace(/[^0-9]/g, ""), 10) || 0;
      const advanceGiven = parseInt(String(row[40] || "").replace(/[^0-9]/g, ""), 10) || 0;
      const netPayable = parseInt(String(row[41] || "").replace(/[^0-9]/g, ""), 10) || 0;

      // 1. Auto-Register or Update Employee in Employee Master
      const existingEmp = await prisma.employee.findFirst({
        where: {
          OR: [{ employeeCode: empId || "" }, { name: empName || "" }],
        },
      });

      let employeeDbId = existingEmp ? existingEmp.id : "";

      if (!existingEmp) {
        const createdEmp = await prisma.employee.create({
          data: {
            employeeCode: empId || `EMP-${r}`,
            name: empName || `STAFF ${empId}`,
            phoneNumber: phone || `99999999${String(r).padStart(2, "0")}`,
            password: "KleenkarsDefaultPass123!",
            role: "staff",
            salaryPerDay: monthlySalary > 0 ? Math.round(monthlySalary / 30) : 500,
            status: "active",
          },
        });
        employeeDbId = createdEmp.id;
        totalEmployeesSynced++;
      } else {
        if (phone && (!existingEmp.phoneNumber || existingEmp.phoneNumber === "9999999999")) {
          await prisma.employee.update({
            where: { id: existingEmp.id },
            data: { phoneNumber: phone },
          });
        }
      }

      // 2. Insert Daily Attendance for days 1..31
      for (let day = 1; day <= 31; day++) {
        const colIdx = 4 + day; // Day 1 is index 5
        const rawStatus = cleanUpper(row[colIdx]);
        if (!rawStatus) continue;

        let statusFormatted = "Present";
        if (rawStatus === "P" || rawStatus === "PRESENT") statusFormatted = "Present";
        else if (rawStatus === "HD" || rawStatus === "H" || rawStatus === "HALF DAY") statusFormatted = "Half Day";
        else if (rawStatus === "A" || rawStatus === "ABSENT") statusFormatted = "Absent";
        else if (rawStatus === "OFF" || rawStatus === "W" || rawStatus === "HOLIDAY") statusFormatted = "Off";

        const dayDate = new Date(Date.UTC(parsedMonth.year, parsedMonth.month - 1, day, 4, 30, 0));
        const dayStart = new Date(Date.UTC(parsedMonth.year, parsedMonth.month - 1, day, 0, 0, 0));
        const dayEnd = new Date(Date.UTC(parsedMonth.year, parsedMonth.month - 1, day, 23, 59, 59));

        // Deduplicate existing checkin for this employee on this date
        const existingAtt = await prisma.attendance.findFirst({
          where: {
            employeeCode: empId || existingEmp?.employeeCode || "",
            checkIn: { gte: dayStart, lte: dayEnd },
          },
        });

        if (!existingAtt) {
          await prisma.attendance.create({
            data: {
              employeeId: employeeDbId || empId || "SYS",
              employeeCode: empId || existingEmp?.employeeCode || "SYS",
              employeeName: empName || existingEmp?.name || "STAFF",
              checkIn: dayDate,
              attendanceStatus: statusFormatted,
              notes: `Google Sheet Sync (${parsedMonth.monthKey})`,
            },
          });
          totalAttendanceInserted++;
        }
      }

      // 3. Upsert Monthly Payroll Record
      const existingPayroll = await prisma.payroll.findFirst({
        where: {
          employeeCode: empId || existingEmp?.employeeCode || "",
          month: parsedMonth.monthKey,
        },
      });

      const payrollPayload = {
        employeeId: employeeDbId || empId || "SYS",
        employeeName: empName || existingEmp?.name || "STAFF",
        employeeCode: empId || existingEmp?.employeeCode || "SYS",
        month: parsedMonth.monthKey,
        workingDays: presentDays,
        dailyWage: monthlySalary > 0 ? Math.round(monthlySalary / 30) : 500,
        advances: advanceGiven,
        deductions: Math.max(0, monthlySalary - finalSalary),
        netPayable: netPayable || finalSalary - advanceGiven,
        status: "Paid",
      };

      if (existingPayroll) {
        await prisma.payroll.update({
          where: { id: existingPayroll.id },
          data: payrollPayload,
        });
      } else {
        await prisma.payroll.create({
          data: payrollPayload,
        });
      }
      totalPayrollUpserted++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced Attendance and Payroll from Google Sheet (${totalAttendanceInserted} daily check-ins logged, ${totalPayrollUpserted} monthly payrolls processed, ${totalEmployeesSynced} new staff registered)!`,
      totalAttendanceInserted,
      totalPayrollUpserted,
      totalEmployeesSynced,
    });
  } catch (error: any) {
    console.error("Attendance Google Sheet Sync Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to sync attendance from Google Sheet" },
      { status: 500 }
    );
  }
}
