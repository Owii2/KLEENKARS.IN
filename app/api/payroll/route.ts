import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";

export async function GET() {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const payrolls = await prisma.payroll.findMany({
      orderBy: { month: "desc" },
    });
    return NextResponse.json({ success: true, payrolls });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to fetch payroll" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireRoles(["admin", "manager"]);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { autoProcess, month, employeeId, employeeName, employeeCode, workingDays, dailyWage, advances, deductions, netPayable, status } = body;

    if (autoProcess) {
      if (!month) {
        return NextResponse.json({ success: false, message: "Month is required for autoprocessing" }, { status: 400 });
      }

      // Query all active employees
      const employees = await prisma.employee.findMany({
        where: { isActive: true },
      });

      // Query all attendance for the target month
      const startOfMonth = new Date(`${month}-01T00:00:00Z`);
      // Get end of month (e.g. next month minus 1 day)
      const parts = month.split("-");
      const nextMonth = Number(parts[1]) === 12 ? 1 : Number(parts[1]) + 1;
      const nextYear = Number(parts[1]) === 12 ? Number(parts[0]) + 1 : Number(parts[0]);
      const endOfMonth = new Date(`${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00Z`);

      const attendance = await prisma.attendance.findMany({
        where: {
          checkIn: {
            gte: startOfMonth,
            lt: endOfMonth,
          },
        },
      });

      const processedRecords = [];

      for (const emp of employees) {
        const empAtt = attendance.filter((a) => a.employeeId === emp.id);
        let presentCount = 0;
        let halfDayCount = 0;

        empAtt.forEach((a) => {
          const s = a.attendanceStatus?.trim().toLowerCase();
          if (s === "present") presentCount += 1;
          else if (s === "half day" || s === "halfday" || s === "half-day") halfDayCount += 1;
        });

        const calculatedWorkingDays = presentCount + (0.5 * halfDayCount);
        const wage = emp.salaryPerDay || 0;
        const adv = emp.penalties || 0; // use penalties as initial advances/deductions
        const ded = 0;
        const calculatedNetPayable = Math.max((calculatedWorkingDays * wage) - adv, 0);

        // Check if payroll already exists for this employee and month
        const existing = await prisma.payroll.findFirst({
          where: { employeeId: emp.id, month },
        });

        let payroll;
        if (existing) {
          payroll = await prisma.payroll.update({
            where: { id: existing.id },
            data: {
              workingDays: Math.round(calculatedWorkingDays),
              dailyWage: wage,
              advances: adv,
              deductions: ded,
              netPayable: Math.round(calculatedNetPayable),
            },
          });
        } else {
          payroll = await prisma.payroll.create({
            data: {
              employeeId: emp.id,
              employeeName: emp.name,
              employeeCode: emp.employeeCode,
              month,
              workingDays: Math.round(calculatedWorkingDays),
              dailyWage: wage,
              advances: adv,
              deductions: ded,
              netPayable: Math.round(calculatedNetPayable),
              status: "Unpaid",
            },
          });
        }
        processedRecords.push(payroll);
      }

      return NextResponse.json({ success: true, processedRecords });
    }

    // Manual creation
    if (!employeeId || !employeeName || !employeeCode || !month || workingDays === undefined || dailyWage === undefined) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const netVal = netPayable !== undefined ? Number(netPayable) : (Number(workingDays) * Number(dailyWage)) - Number(advances || 0) - Number(deductions || 0);

    const payroll = await prisma.payroll.create({
      data: {
        employeeId,
        employeeName,
        employeeCode,
        month,
        workingDays: Number(workingDays),
        dailyWage: Number(dailyWage),
        advances: advances !== undefined ? Number(advances) : 0,
        deductions: deductions !== undefined ? Number(deductions) : 0,
        netPayable: Math.round(netVal),
        status: status || "Unpaid",
      },
    });

    return NextResponse.json({ success: true, payroll });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to process payroll" }, { status: 500 });
  }
}
