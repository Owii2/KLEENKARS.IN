"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

export default function EmployeeAttendanceMonthPage({
  params,
  searchParams,
}: {
  params: { employeeId: string; month: string };
  searchParams: { year?: string };
}) {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentYear = new Date().getFullYear();
  const year = searchParams.year ? Number(searchParams.year) : currentYear;
  const monthIndex = Number(params.month) - 1;
  const monthName = monthNames[monthIndex] || "Unknown";

  const fetchData = async () => {
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
      setError(err instanceof Error ? err.message : "Failed to load details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.employeeId, params.month]);

  const selectedRecords = useMemo(() => {
    if (monthIndex < 0 || monthIndex > 11) return [];
    return attendance.filter((item) => {
      const date = new Date(item.checkIn);
      return (
        item.employeeId === params.employeeId &&
        date.getFullYear() === year &&
        date.getMonth() === monthIndex
      );
    });
  }, [attendance, params.employeeId, monthIndex, year]);

  const presentCount = selectedRecords.filter((item) => item.attendanceStatus === "Present").length;
  const absentCount = selectedRecords.filter((item) => item.attendanceStatus === "Absent").length;
  const halfDayCount = selectedRecords.filter((item) => item.attendanceStatus === "Half Day").length;

  if (loading) {
    return (
      <DashboardLayout title="Attendance Month">
        <Card>Loading attendance details...</Card>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Attendance Month">
        <Card className="text-red-400">{error}</Card>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout title="Attendance Month">
        <Card className="text-red-400">Employee not found.</Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`${employee.name} — ${monthName} ${year}`}>
      <Card className="mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-400">Employee</p>
            <h1 className="text-3xl font-bold text-white">{employee.name}</h1>
            <p className="text-sm text-gray-400">{employee.employeeCode}</p>
            <p className="text-sm text-gray-400 mt-2">Month: {monthName} {year}</p>
          </div>
          <Link
            href={`/admin/attendance/${employee.id}?year=${year}`}
            className="inline-flex items-center rounded-lg border border-gray-700 bg-black px-4 py-2 text-sm text-white hover:border-red-500"
          >
            Back to months
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="bg-[#111] p-6">
          <p className="text-sm text-gray-400">Present</p>
          <p className="text-2xl font-bold text-green-400">{presentCount}</p>
        </Card>
        <Card className="bg-[#111] p-6">
          <p className="text-sm text-gray-400">Absent</p>
          <p className="text-2xl font-bold text-red-400">{absentCount}</p>
        </Card>
        <Card className="bg-[#111] p-6">
          <p className="text-sm text-gray-400">Half Day</p>
          <p className="text-2xl font-bold text-yellow-400">{halfDayCount}</p>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-red-600 text-white">
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Time</th>
              </tr>
            </thead>
            <tbody>
              {selectedRecords.length === 0 ? (
                <tr>
                  <td className="p-4" colSpan={3}>
                    No attendance records found for this month.
                  </td>
                </tr>
              ) : (
                selectedRecords.map((item) => {
                  const date = new Date(item.checkIn);
                  return (
                    <tr key={item.id} className="border-b border-gray-800 hover:bg-[#181818]">
                      <td className="p-3">{date.toLocaleDateString()}</td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          item.attendanceStatus === "Present"
                            ? "bg-green-600"
                            : item.attendanceStatus === "Absent"
                            ? "bg-red-600"
                            : "bg-yellow-600"
                        }`}>
                          {item.attendanceStatus}
                        </span>
                      </td>
                      <td className="p-3">{date.toLocaleTimeString()}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
