"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Card from "@/components/ui/Card";

interface Attendance {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  attendanceStatus: string;
  checkIn: string;
}

interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  status: string;
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function EmployeeAttendancePage() {
  const routeParams = useParams<{ employeeId: string }>();
  const employeeId = routeParams?.employeeId || "";
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const searchParams = useSearchParams();

  const fetchData = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    setError("");

    try {
      const [attendanceResponse, employeesResponse] = await Promise.all([
        fetch("/api/attendance"),
        fetch("/api/employees"),
      ]);

      const attendanceData = await attendanceResponse.json();
      const employeesData = await employeesResponse.json();

      if (!attendanceResponse.ok) {
        throw new Error(attendanceData.message || "Failed to load attendance");
      }
      if (!employeesResponse.ok) {
        throw new Error(employeesData.message || "Failed to load employees");
      }

      setAttendance(attendanceData.attendance || []);
      const found = (employeesData.employees || []).find(
        (item: Employee) => item.id === employeeId
      );
      setEmployee(found ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employee details");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    const yearParam = searchParams?.get("year");
    if (yearParam) {
      const yearValue = Number(yearParam);
      if (!Number.isNaN(yearValue)) {
        setSelectedYear(yearValue);
      }
    }
    fetchData();
  }, [fetchData, searchParams]);

  const employeeAttendance = attendance.filter((item) => item.employeeId === employeeId);

  const monthlySummary = useMemo(() => {
    const summary = monthNames.map((name, index) => ({
      month: name,
      number: index + 1,
      present: 0,
      absent: 0,
      halfDay: 0,
    }));

    employeeAttendance.forEach((record) => {
      const date = new Date(record.checkIn);
      if (date.getFullYear() !== selectedYear) return;

      const monthIndex = date.getMonth();
      const status = record.attendanceStatus?.trim().toLowerCase();

      if (status === "present") {
        summary[monthIndex].present += 1;
      } else if (status === "absent") {
        summary[monthIndex].absent += 1;
      } else if (status === "half day") {
        summary[monthIndex].halfDay += 1;
      }
    });

    return summary;
  }, [employeeAttendance, selectedYear]);

  const totalPresent = monthlySummary.reduce((sum, item) => sum + item.present, 0);
  const totalAbsent = monthlySummary.reduce((sum, item) => sum + item.absent, 0);
  const totalHalfDay = monthlySummary.reduce((sum, item) => sum + item.halfDay, 0);
  const calculatedAttendancePercent =
    totalPresent + totalAbsent + totalHalfDay > 0
      ? Math.round(
          ((totalPresent + totalHalfDay * 0.5) /
            (totalPresent + totalAbsent + totalHalfDay)) *
            100
        )
      : 100;

  return (
    <DashboardLayout title="Employee Attendance">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Link
            href="/admin/attendance"
            className="text-sm text-gray-400 hover:text-white transition inline-flex items-center gap-2 mb-2"
          >
            ← Back to Attendance
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {employee ? `${employee.name} (${employee.employeeCode})` : "Employee Attendance"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="year-select" className="text-sm text-gray-400">
            Year:
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
          >
            {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((year) => (
              <option key={year} value={year} className="bg-black text-white">
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <p className="text-xs text-gray-400">Total Present</p>
          <p className="text-2xl font-bold text-green-400 mt-2">{totalPresent} Days</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-400">Total Absent</p>
          <p className="text-2xl font-bold text-red-400 mt-2">{totalAbsent} Days</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-400">Total Half Days</p>
          <p className="text-2xl font-bold text-yellow-400 mt-2">{totalHalfDay} Days</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-400">Attendance Rate</p>
          <p className="text-2xl font-bold text-white mt-2">
            {calculatedAttendancePercent}%
          </p>
        </Card>
      </div>

      <Card>
        {error ? <p className="text-red-400 mb-4">{error}</p> : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead>
              <tr className="bg-red-600 text-white">
                <th className="p-3">Month</th>
                <th className="p-3">Present</th>
                <th className="p-3">Absent</th>
                <th className="p-3">Half Day</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4" colSpan={5}>
                    Loading attendance data...
                  </td>
                </tr>
              ) : (
                monthlySummary.map((month) => (
                  <tr key={month.month} className="border-b border-gray-800">
                    <td className="p-3 font-semibold">{month.month}</td>
                    <td className="p-3 text-green-400">{month.present}</td>
                    <td className="p-3 text-red-400">{month.absent}</td>
                    <td className="p-3 text-yellow-400">{month.halfDay}</td>
                    <td className="p-3">
                      <Link
                        href={`/admin/attendance/${employeeId}/${month.number}?year=${selectedYear}`}
                        className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:text-white transition"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
