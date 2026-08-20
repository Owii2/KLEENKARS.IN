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

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [attendanceStatus, setAttendanceStatus] = useState("Present");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncingSheet, setSyncingSheet] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const currentYear = new Date().getFullYear();

  const handleSyncGoogleSheet = async () => {
    try {
      setSyncingSheet(true);
      setError("");
      setSuccessMessage("");

      const res = await fetch("/api/attendance/google-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message || "Attendance & Payroll synced from Google Sheet!");
        setTimeout(() => setSuccessMessage(""), 5000);
        fetchData();
      } else {
        setError(data.message || "Failed to sync attendance from Google Sheet.");
      }
    } catch (err: any) {
      setError("Network error syncing attendance: " + err.message);
    } finally {
      setSyncingSheet(false);
    }
  };

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
      setEmployees(employeesData.employees || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredAttendance = attendance.filter((item) => {
    const matchesStatus = statusFilter === "All" || item.attendanceStatus === statusFilter;
    const matchesSearch =
      item.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.employeeName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const presentCount = attendance.filter((item) => item.attendanceStatus === "Present").length;
  const absentCount = attendance.filter((item) => item.attendanceStatus === "Absent").length;
  const halfDayCount = attendance.filter((item) => item.attendanceStatus === "Half Day").length;
  const activeEmployeeCount = employees.filter((employee) => employee.status === "active").length;

  const currentMonth = new Date().getMonth();
  const activeStaffStats = useMemo(() => {
    const filtered = attendance.filter((item) => {
      const date = new Date(item.checkIn);
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    });

    return employees
      .filter((employee) => employee.status === "active")
      .map((employee) => {
        const records = filtered.filter((record) => record.employeeId === employee.id);
        return {
          ...employee,
          present: records.filter((record) => record.attendanceStatus === "Present").length,
          absent: records.filter((record) => record.attendanceStatus === "Absent").length,
          halfDay: records.filter((record) => record.attendanceStatus === "Half Day").length,
        };
      });
  }, [attendance, employees, currentYear, currentMonth]);

  const currentMonthName = new Date().toLocaleString("default", { month: "long" });

  const markAttendance = async () => {
    const employee = employees.find((item) => item.id === employeeId);

    if (!employee) {
      setError("Select an employee before marking attendance");
      return;
    }

    setError("");

    const response = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        employeeName: employee.name,
        attendanceStatus,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Could not mark attendance");
      return;
    }

    setEmployeeId("");
    setSuccessMessage("Attendance marked successfully.");
    setTimeout(() => setSuccessMessage(""), 3000);
    fetchData();
  };

  const deleteAttendance = async (id: string) => {
    if (!confirm("Remove this attendance record?")) return;
    try {
      const response = await fetch(`/api/attendance/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Could not delete attendance record");
        return;
      }
      setSuccessMessage("Attendance record deleted.");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchData();
    } catch {
      setError("Failed to delete attendance record");
    }
  };

  return (
    <DashboardLayout title="Attendance">
      {/* GOOGLE SHEET SYNC ACTIONS */}
      <div className="bg-[#12121a] p-5 rounded-3xl border border-white/5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl">
            📅
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Google Sheet Attendance &amp; Payroll Auto-Sync</h2>
            <p className="text-xs text-gray-400">
              Synchronizes all 46 columns: Daily check-ins (1-31), Present/Half/Absent counts, salary, and advances.
            </p>
          </div>
        </div>

        <button
          onClick={handleSyncGoogleSheet}
          disabled={syncingSheet}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer shrink-0"
        >
          <span>{syncingSheet ? "⏳ Reading Sheet & Syncing..." : "⚡ Sync from Google Sheet"}</span>
        </button>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-sm font-medium animate-in fade-in">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm font-medium animate-in fade-in">
          {error}
        </div>
      )}

      <Card className="mb-8">
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-400">Active Staff</p>
            <p className="text-3xl font-bold text-white">{activeEmployeeCount}</p>
          </div>
          <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-400">Present</p>
            <p className="text-3xl font-bold text-green-400">{presentCount}</p>
          </div>
          <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-400">Absent</p>
            <p className="text-3xl font-bold text-red-400">{absentCount}</p>
          </div>
          <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-400">Half Day</p>
            <p className="text-3xl font-bold text-yellow-400">{halfDayCount}</p>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-400">Current month active staff</p>
              <p className="text-xl font-semibold text-white">{currentMonthName} {currentYear}</p>
            </div>
            <p className="text-sm text-gray-400">Click a staff tile for monthly details</p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {activeStaffStats.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-gray-800 bg-[#111] p-6 text-center text-gray-400">
                No active staff data available for this month.
              </div>
            ) : (
              activeStaffStats.map((staff) => (
                <Link
                  key={staff.id}
                  href={`/admin/attendance/${staff.id}`}
                  className="group block rounded-2xl border border-gray-800 bg-[#111] p-6 transition hover:border-red-500"
                >
                  <p className="text-sm text-gray-400">{staff.employeeCode}</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{staff.name}</h3>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-green-900/40 p-3">
                      <p className="text-xs uppercase text-gray-400">Present</p>
                      <p className="text-lg font-bold text-green-300">{staff.present}</p>
                    </div>
                    <div className="rounded-xl bg-red-900/40 p-3">
                      <p className="text-xs uppercase text-gray-400">Absent</p>
                      <p className="text-lg font-bold text-red-300">{staff.absent}</p>
                    </div>
                    <div className="rounded-xl bg-yellow-900/40 p-3">
                      <p className="text-xs uppercase text-gray-400">Half Day</p>
                      <p className="text-lg font-bold text-yellow-300">{staff.halfDay}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="bg-black border border-gray-700 p-3 rounded-lg"
          >
            <option value="">Select employee</option>
            {employees
              .filter((employee) => employee.status === "active")
              .map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.employeeCode} - {employee.name}
                </option>
              ))}
          </select>
          <select
            value={attendanceStatus}
            onChange={(e) => setAttendanceStatus(e.target.value)}
            className="bg-black border border-gray-700 p-3 rounded-lg"
          >
            <option>Present</option>
            <option>Absent</option>
            <option>Half Day</option>
          </select>
          <button
            onClick={markAttendance}
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg"
          >
            Mark Attendance
          </button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee..."
            className="bg-black border border-gray-700 p-3 rounded-lg"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black border border-gray-700 p-3 rounded-lg"
          >
            <option value="All">All statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Half Day">Half Day</option>
          </select>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Showing</span>
            <span className="font-bold">{filteredAttendance.length}</span>
            <span className="text-sm text-gray-400">records</span>
          </div>
        </div>
        {error ? <p className="text-red-400 mt-4">{error}</p> : null}
        {successMessage ? <p className="text-green-400 mt-4">{successMessage}</p> : null}
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="bg-red-600">
                <th className="p-3 text-left">Employee ID</th>
                <th className="p-3 text-left">Employee</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Check In</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4" colSpan={5}>
                    Loading attendance...
                  </td>
                </tr>
              ) : filteredAttendance.length === 0 ? (
                <tr>
                  <td className="p-4" colSpan={5}>
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800 hover:bg-[#181818]">
                    <td className="p-3">{item.employeeCode}</td>
                    <td className="p-3">{item.employeeName}</td>
                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          item.attendanceStatus === "Present"
                            ? "bg-green-600"
                            : item.attendanceStatus === "Absent"
                            ? "bg-red-600"
                            : "bg-yellow-600"
                        }`}
                      >
                        {item.attendanceStatus}
                      </span>
                    </td>
                    <td className="p-3">{new Date(item.checkIn).toLocaleString()}</td>
                    <td className="p-3">
                      <button
                        onClick={() => deleteAttendance(item.id)}
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
                      >
                        Delete
                      </button>
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
