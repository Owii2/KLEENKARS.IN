import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/apiAuth";
import bcrypt from "bcryptjs";

function parseDate(dStr: string) {
  if (!dStr) return new Date();
  const parts = dStr.trim().split(/[\/\-]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(Date.UTC(year, month, day));
  }
  return new Date();
}

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
      if (char === "\r" && nextChar === "\n") i++;
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c.length > 0)) rows.push(currentRow);
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) rows.push(currentRow);
  }
  return rows;
}

const DEFAULT_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1G1vI5n7QifWB778D5d37wrRZqlZjcLUlxtCb9gUtPWc/gviz/tq?tqx=out:csv&sheet=Staff_Master";

export async function GET() {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const res = await fetch(DEFAULT_SHEET_URL, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ success: false, message: "Failed to fetch Staff_Master Google Sheet." }, { status: 400 });
    }
    const text = await res.text();
    const rows = parseCsvContent(text);
    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "Staff_Master sheet is empty." }, { status: 400 });
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    return NextResponse.json({
      success: true,
      headers,
      totalRows: dataRows.length,
      sample: dataRows.slice(0, 5),
    });
  } catch (error: any) {
    console.error("Error previewing Staff_Master Google Sheet:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to load preview" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    let sheetUrl = DEFAULT_SHEET_URL;
    try {
      const body = await req.json();
      if (body.sheetUrl) sheetUrl = body.sheetUrl;
    } catch {}

    const res = await fetch(sheetUrl, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ success: false, message: "Failed to fetch Staff_Master Google Sheet." }, { status: 400 });
    }

    const text = await res.text();
    const rows = parseCsvContent(text);
    if (rows.length <= 1) {
      return NextResponse.json({ success: false, message: "No data rows found in Staff_Master sheet." }, { status: 400 });
    }

    const defaultBranch = await prisma.branch.findFirst();
    const defaultBranchId = defaultBranch?.id || null;
    const defaultBranchName = defaultBranch?.name || "ALIGARH Flagship Hub";

    let createdCount = 0;
    let updatedCount = 0;
    const syncedEmployees: any[] = [];

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const code = r[0]?.trim();
      if (!code) continue;

      const name = r[1]?.trim() || "Staff";
      const roleRaw = (r[2]?.trim() || "washer").toLowerCase();
      const joinDate = parseDate(r[3]);
      let dailyWage = 0;
      if (r[5]) {
        const val = parseFloat(r[5]);
        if (!isNaN(val)) dailyWage = Math.round(val < 1 ? 0 : val);
      }
      let phone = r[6]?.trim() || "";
      const advance = parseFloat(r[11]) || 0;
      const statusRaw = (r[13]?.trim() || "Active").toLowerCase();
      const isLeftOrInactive = statusRaw.includes("left") || statusRaw.includes("inactive");
      const status = isLeftOrInactive ? "inactive" : "active";
      const isActive = !isLeftOrInactive;

      let role = "washer";
      if (roleRaw.includes("owner") || roleRaw.includes("admin")) role = "admin";
      else if (roleRaw.includes("manager")) role = "manager";
      else if (roleRaw.includes("supervisor")) role = "supervisor";
      else if (roleRaw.includes("helper")) role = "washer";

      const existing = await prisma.employee.findUnique({
        where: { employeeCode: code },
      });

      if (!phone) {
        if (existing && existing.phoneNumber) {
          phone = existing.phoneNumber;
        } else {
          phone = `999000${code.replace(/\D/g, "").padStart(4, "0")}`;
        }
      }

      const defaultHashedPassword = await bcrypt.hash(`kleenkars@${code.toLowerCase()}`, 10);

      if (existing) {
        const phoneConflict = await prisma.employee.findFirst({
          where: {
            phoneNumber: phone,
            NOT: { id: existing.id },
          },
        });

        const safePhone = phoneConflict ? existing.phoneNumber : phone;

        const updated = await prisma.employee.update({
          where: { id: existing.id },
          data: {
            name,
            role,
            salaryPerDay: dailyWage,
            phoneNumber: safePhone,
            status,
            isActive,
            penalties: advance,
            joiningDate: joinDate,
            branch: existing.branch || defaultBranchName,
            branchId: existing.branchId || defaultBranchId,
          },
        });
        syncedEmployees.push(updated);
        updatedCount++;
      } else {
        const phoneConflict = await prisma.employee.findFirst({
          where: { phoneNumber: phone },
        });
        const safePhone = phoneConflict ? `999000${code.replace(/\D/g, "").padStart(4, "0")}` : phone;

        const created = await prisma.employee.create({
          data: {
            employeeCode: code,
            name,
            role,
            salaryPerDay: dailyWage,
            phoneNumber: safePhone,
            status,
            isActive,
            penalties: advance,
            joiningDate: joinDate,
            password: defaultHashedPassword,
            branch: defaultBranchName,
            branchId: defaultBranchId,
            shiftType: "day",
          },
        });
        syncedEmployees.push(created);
        createdCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Staff sync complete! Created ${createdCount} new employees, updated ${updatedCount} existing staff profiles.`,
      createdCount,
      updatedCount,
      totalSynced: syncedEmployees.length,
    });
  } catch (error: any) {
    console.error("Error syncing Staff_Master Google Sheet:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to sync staff records." }, { status: 500 });
  }
}
