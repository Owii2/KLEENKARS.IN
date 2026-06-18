"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

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

export default function EmployeeAttendancePage({
  params,
}: {
  params: { employeeId: string };
}) {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const searchParams = useSearchParams();

  const fetchData = useCallback(async () => {
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
        (item: Employee) => item.id === params.employeeId
      );
      setEmployee(found ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employee details");
    } finally {
      setLoading(false);
    }
  }, [params.employeeId]);

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

  const employeeAttendance = attendance.filter((item) => item.employeeId === params.employeeId);

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
      const month = date.getMonth();
      const bucket = summary[month];
      if (!bucket) return;
      if (record.attendanceStatus === "Present") bucket.present += 1;
      else if (record.attendanceStatus === "Absent") bucket.absent += 1;
      else if (record.attendanceStatus === "Half Day") bucket.halfDay += 1;
    });

    return summary;
  }, [employeeAttendance, selectedYear]);

  const totalPresent = monthlySummary.reduce((sum, item) => sum + item.present, 0);
  const totalAbsent = monthlySummary.reduce((sum, item) => sum + item.absent, 0);
  const totalHalfDay = monthlySummary.reduce((sum, item) => sum + item.halfDay, 0);
  const yearOptions = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear].filter((y) => y >= 2000);

  if (loading) {
    return (
      <DashboardLayout title="Attendance Details">
        <Card>Loading employee attendance...</Card>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Attendance Details">
        <Card className="text-red-400">{error}</Card>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout title="Attendance Details">
        <Card className="text-red-400">Employee not found.</Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Attendance for ${employee.name}`}>
      <Card className="mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-400">Employee</p>
            <h1 className="text-3xl font-bold text-white">{employee.name}</h1>
            <p className="text-sm text-gray-400">{employee.employeeCode}</p>
          </div>
          <Link
            href="/admin/attendance"
            className="inline-flex items-center rounded-lg border border-gray-700 bg-black px-4 py-2 text-sm text-white hover:border-red-500"
          >
            Back to active staff
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="bg-[#111] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-400">Year</p>
              <p className="text-2xl font-bold text-white">{selectedYear}</p>
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-black border border-gray-700 p-2 rounded-lg text-sm"
            >
              {yearOptions.map((yearOption) => (
                <option key={yearOption} value={yearOption}>
                  {yearOption}
                </option>
              ))}
            </select>
          </div>
        </Card>
        <Card className="bg-[#111] p-6">
          <p className="text-sm text-gray-400">Present</p>
          <p className="text-2xl font-bold text-green-400">{totalPresent}</p>
        </Card>
        <Card className="bg-[#111] p-6">
          <p className="text-sm text-gray-400">Absent</p>
          <p className="text-2xl font-bold text-red-400">{totalAbsent}</p>
        </Card>
        <Card className="bg-[#111] p-6">
          <p className="text-sm text-gray-400">Half Day</p>
          <p className="text-2xl font-bold text-yellow-400">{totalHalfDay}</p>
        </Card>
      </div>

      <Card>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {monthlySummary.map((month) => (
            <Link
              key={month.number}
              href={`/admin/attendance/${employee.id}/${month.number}?year=${selectedYear}`}
              className="group rounded-2xl border border-gray-800 bg-[#111] p-6 transition hover:border-red-500"
            >
              <p className="text-sm text-gray-400">{month.month}</p>
              <h2 className="mt-2 text-xl font-semibold text-white">{month.present + month.absent + month.halfDay} records</h2>
              <div className="mt-4 grid gap-2">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Present</span>
                  <span className="font-bold text-green-300">{month.present}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Absent</span>
                  <span className="font-bold text-red-300">{month.absent}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Half Day</span>
                  <span className="font-bold text-yellow-300">{month.halfDay}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </DashboardLayout>
  );
}
