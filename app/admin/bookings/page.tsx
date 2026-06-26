"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Card from "@/components/ui/Card";
import { jsPDF } from "jspdf";

interface Booking {
  id: string;
  customerName: string;
  phoneNumber: string;
  vehicleType: string;
  serviceType: string;
  addons: string[];
  pickupDrop: boolean;
  bookingDate: string;
  bookingTime: string;
  totalCost: number;
  status: string;
  assignedEmployeeId?: string | null;
  assignedEmployeeName?: string | null;
}

export default function BookingsPage() {
  // Data States
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string; employeeCode?: string; role?: string; customerRating?: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignReason, setAssignReason] = useState("");

  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter States
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  const handleAutoAssign = async () => {
    try {
      setAssignReason("Calculating best staff...");
      const resAttendance = await fetch("/api/attendance");
      const dataAttendance = await resAttendance.json();
      const attendance = dataAttendance.attendance || [];

      // Find employees checked in today (status "Present" or similar, checkIn is today)
      const todayStr = new Date().toISOString().split('T')[0];
      const todayPresentIds = new Set(
        attendance
          .filter((att: any) => {
            const isToday = new Date(att.checkIn).toISOString().split('T')[0] === todayStr;
            const isPresent = att.attendanceStatus?.trim().toLowerCase() === "present";
            return isToday && isPresent;
          })
          .map((att: any) => att.employeeId)
      );

      // Filter employees who are washers/detailers/staff/supervisor
      const activeRoles = ["washer", "detailer", "staff", "supervisor"];
      const eligibleEmployees = employees.filter((emp) => {
        const isEligibleRole = activeRoles.includes(emp.role?.toLowerCase() || "");
        return isEligibleRole;
      });

      if (eligibleEmployees.length === 0) {
        alert("No detailers or washers found in system!");
        setAssignReason("");
        return;
      }

      // Calculate active workload (bookings that are currently Assigned or Washing) for each eligible employee
      const workloadMap: Record<string, number> = {};
      eligibleEmployees.forEach((emp) => {
        workloadMap[emp.id] = bookings.filter(
          (b) => b.assignedEmployeeId === emp.id && ["Assigned", "Washing"].includes(b.status)
        ).length;
      });

      // Sort eligible employees by:
      // 1. Checked-in status (present today)
      // 2. Active workload (ascending)
      // 3. Customer rating (descending)
      const sorted = [...eligibleEmployees].sort((a, b) => {
        const aPresent = todayPresentIds.has(a.id) ? 1 : 0;
        const bPresent = todayPresentIds.has(b.id) ? 1 : 0;
        if (aPresent !== bPresent) return bPresent - aPresent; // present first

        const aLoad = workloadMap[a.id] || 0;
        const bLoad = workloadMap[b.id] || 0;
        if (aLoad !== bLoad) return aLoad - bLoad; // lower load first

        const aRating = a.customerRating || 5.0;
        const bRating = b.customerRating || 5.0;
        return bRating - aRating; // higher rating first
      });

      const best = sorted[0];
      const isPresentToday = todayPresentIds.has(best.id);
      const activeJobs = workloadMap[best.id] || 0;

      setDrawerData({
        ...drawerData,
        assignedEmployeeId: best.id,
        assignedEmployeeName: best.name,
      });
      setEmpQuery(best.name);

      setAssignReason(
        `Suggested ${best.name} (${isPresentToday ? "Present today" : "No today check-in"}, ${activeJobs} active jobs)`
      );
    } catch (err) {
      console.error(err);
      alert("Error auto-assigning staff");
      setAssignReason("");
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredBookings.map((b) => b.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const exportToCSV = () => {
    const selectedBookings = bookings.filter((b) => selectedIds.includes(b.id));
    const headers = ["Booking ID", "Customer Name", "Phone", "Vehicle Type", "Wash Package", "Addons", "Date", "Time", "Status", "Assigned To", "Total Cost"];
    const rows = selectedBookings.map((b) => [
      b.id,
      b.customerName,
      b.phoneNumber,
      b.vehicleType,
      b.serviceType,
      (b.addons || []).join("; "),
      b.bookingDate,
      b.bookingTime,
      b.status,
      b.assignedEmployeeName || "Unassigned",
      b.totalCost
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bookings_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkComplete = async () => {
    if (!confirm(`Mark ${selectedIds.length} selected bookings as Completed?`)) return;
    try {
      setLoading(true);
      await Promise.all(
        selectedIds.map(async (id) => {
          const booking = bookings.find(b => b.id === id);
          return fetch(`/api/bookings/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "Completed",
              totalCost: booking?.totalCost,
              assignedEmployeeId: booking?.assignedEmployeeId,
              assignedEmployeeName: booking?.assignedEmployeeName,
            })
          });
        })
      );
      alert("Successfully updated selected bookings to Completed!");
      setSelectedIds([]);
      fetchBookings();
    } catch (err) {
      console.error("Bulk complete error:", err);
      alert("Failed to complete some bookings.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Wipe ${selectedIds.length} selected bookings permanently from database? This cannot be undone!`)) return;
    try {
      setLoading(true);
      await Promise.all(
        selectedIds.map((id) => fetch(`/api/bookings/${id}`, { method: "DELETE" }))
      );
      alert("Successfully deleted selected bookings!");
      setSelectedIds([]);
      fetchBookings();
    } catch (err) {
      console.error("Bulk delete error:", err);
      alert("Failed to delete some bookings.");
    } finally {
      setLoading(false);
    }
  };

  // Drawer / Details Modal States
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [drawerData, setDrawerData] = useState<Partial<Booking>>({});
  const [empQuery, setEmpQuery] = useState("");
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const [savingDrawer, setSavingDrawer] = useState(false);
  const empRef = useRef<HTMLDivElement | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bookings");
      const data = await response.json();
      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error("Failed to load bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (err) {
      console.error("Failed to load employees:", err);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchEmployees();
  }, []);

  // Handle outside click for employee auto-suggest dropdown
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (empRef.current && !empRef.current.contains(e.target as Node)) {
        setShowEmpDropdown(false);
      }
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const filteredEmployees = useMemo(() => {
    const q = empQuery.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) ||
        (emp.employeeCode && emp.employeeCode.toLowerCase().includes(q))
    );
  }, [employees, empQuery]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesSearch =
        booking.customerName.toLowerCase().includes(search.toLowerCase()) ||
        booking.phoneNumber.includes(search);

      const matchesStatus = filterStatus === "all" || booking.status === filterStatus;
      const matchesDate = !filterDate || booking.bookingDate === filterDate;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [bookings, search, filterStatus, filterDate]);

  const handleSaveDrawer = async () => {
    if (!selectedBooking) return;

    try {
      setSavingDrawer(true);
      const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalCost: Number(drawerData.totalCost) || 0,
          status: drawerData.status || "Pending",
          assignedEmployeeId: drawerData.assignedEmployeeId || null,
          assignedEmployeeName: drawerData.assignedEmployeeName || "",
        }),
      });

      const data = await res.json();
      if (responseOk(res, data)) {
        alert("Booking details saved successfully!");
        setSelectedBooking(null);
        fetchBookings();
      } else {
        alert(data.message || "Failed to save booking");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating booking");
    } finally {
      setSavingDrawer(false);
    }
  };

  const responseOk = (res: Response, data: any) => {
    return res.ok && (data.success || data.booking);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this booking permanently? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Booking deleted successfully");
        setSelectedBooking(null);
        fetchBookings();
      } else {
        alert("Failed to delete booking");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting booking");
    }
  };

  // Premium PDF Invoice Receipt Generation
  const downloadInvoice = (booking: Booking) => {
    const doc = new jsPDF();

    // Red Header Bar
    doc.setFillColor(220, 38, 38); // bg-red-600
    doc.rect(0, 0, 210, 45, "F");

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text("KLEENKARS", 15, 25);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("PREMIUM VEHICLE WASH & DETAILING SERVICES", 15, 34);

    // Document label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("INVOICE RECEIPT", 145, 25);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Booking Ref: ${booking.id.toUpperCase()}`, 145, 32);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 145, 37);

    // Body Setup
    doc.setTextColor(40, 40, 40);

    // Bill To Section
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("CUSTOMER DETAILS", 15, 60);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Name:       ${booking.customerName}`, 15, 68);
    doc.text(`Phone:      ${booking.phoneNumber}`, 15, 75);
    doc.text(`Date:       ${booking.bookingDate} at ${booking.bookingTime}`, 15, 82);

    // Service Description Table Headers
    doc.setFillColor(245, 245, 245);
    doc.rect(15, 95, 180, 10, "F");
    doc.setFont("helvetica", "bold");
    doc.text("Description of Wash Services", 20, 101);
    doc.text("Vehicle Class", 115, 101);
    doc.text("Amount (INR)", 160, 101);

    // Line dividers
    doc.setDrawColor(220, 220, 220);
    doc.line(15, 105, 195, 105);

    // Service Row
    doc.setFont("helvetica", "normal");
    doc.text(booking.serviceType, 20, 115);
    doc.text(booking.vehicleType, 115, 115);
    doc.text(`Rs. ${booking.totalCost}`, 160, 115);

    let y = 125;
    // Addons row if present
    if (booking.addons && booking.addons.length > 0) {
      doc.setFont("helvetica", "italic");
      doc.setTextColor(110, 110, 110);
      doc.text(`Selected Addons: ${booking.addons.join(", ")}`, 20, y);
      y += 10;
    }

    // Pickup / Drop indicator
    if (booking.pickupDrop) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text("Includes pickup and delivery services (+)", 20, y);
      y += 10;
    }

    doc.line(15, y, 195, y);
    y += 12;

    // Total Price Box
    doc.setFillColor(254, 242, 242); // light red-50
    doc.rect(110, y - 6, 85, 12, "F");
    doc.setDrawColor(252, 165, 165); // light red border
    doc.rect(110, y - 6, 85, 12, "S");

    doc.setTextColor(220, 38, 38);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Total Paid:", 115, y + 2);
    doc.text(`Rs. ${booking.totalCost}.00`, 155, y + 2);

    y += 35;
    // Terms & Thank you notes
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "italic");
    doc.text("This receipt was generated electronically and is valid for booking status records.", 15, y);
    doc.text("Need support? Contact us at SUPPORT.KLEENKARS@gmail.com", 15, y + 5);
    doc.text("Thank you for choosing Kleenkars detailing centers!", 15, y + 10);

    doc.save(`Kleenkars_Invoice_${booking.customerName.replace(/\s+/g, "_")}.pdf`);
  };

  // Dynamic counter metrics
  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === "Pending" || !b.status).length;
    const working = bookings.filter((b) => ["Assigned", "Washing"].includes(b.status)).length;
    const completed = bookings.filter((b) => ["Completed", "Delivered"].includes(b.status)).length;
    const revenue = bookings.reduce((sum, b) => sum + (b.totalCost || 0), 0);

    return { total, pending, working, completed, revenue };
  }, [bookings]);

  return (
    <DashboardLayout title="Bookings Registry & Operations">
      {/* Counters Metrics bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-[#111] p-5 rounded-xl border border-gray-800 flex flex-col justify-between">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Bookings</span>
          <span className="text-3xl font-bold mt-2 text-white">{stats.total} Bookings</span>
        </div>
        <div className="bg-[#111] p-5 rounded-xl border border-gray-800 flex flex-col justify-between">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Pending Orders</span>
          <span className="text-3xl font-bold text-yellow-500 mt-2">{stats.pending} Orders</span>
        </div>
        <div className="bg-[#111] p-5 rounded-xl border border-gray-800 flex flex-col justify-between">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">In Progress</span>
          <span className="text-3xl font-bold text-blue-400 mt-2">{stats.working} Cars</span>
        </div>
        <div className="bg-[#111] p-5 rounded-xl border border-gray-800 flex flex-col justify-between">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Completed</span>
          <span className="text-3xl font-bold text-green-400 mt-2">{stats.completed} Jobs</span>
        </div>
        <div className="bg-[#111] p-5 rounded-xl border border-gray-800 flex flex-col justify-between col-span-2 lg:col-span-1">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
          <span className="text-2xl font-bold text-cyan-400 mt-2">₹{stats.revenue.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Wash Bookings Registry</h2>
        <Link 
          href="/admin/bookings/trips" 
          className="bg-red-600/10 hover:bg-red-600 border border-red-900/30 hover:border-red-600 text-red-500 hover:text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer"
        >
          🗺️ GPS Trips Route Optimizer
        </Link>
      </div>

      {/* Filter and Search Bar Section */}
      <div className="bg-[#0b0b0b] p-5 rounded-xl border border-gray-800 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black border border-gray-850 focus:border-red-600 outline-none text-white pl-10 pr-4 py-3 rounded-lg transition-colors text-sm"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs font-semibold uppercase">Date:</span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-black border border-gray-800 focus:border-red-600 outline-none text-white text-sm px-3 py-2 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs font-semibold uppercase">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-black border border-gray-800 focus:border-red-600 outline-none text-white text-sm px-3 py-2 rounded-lg"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="Washing">Washing</option>
              <option value="Completed">Completed</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>

          {(search || filterStatus !== "all" || filterDate) && (
            <button
              onClick={() => {
                setSearch("");
                setFilterStatus("all");
                setFilterDate("");
              }}
              className="text-xs text-red-500 hover:text-red-400 hover:underline px-2 py-1 font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Banner */}
      {selectedIds.length > 0 && (
        <div className="bg-red-950/20 border border-red-900/50 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="bg-red-600 text-white font-bold px-2.5 py-1 rounded text-xs">
              {selectedIds.length} SELECTED
            </span>
            <p className="text-sm text-gray-300">Apply action to selected bookings</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Export CSV
            </button>
            <button
              onClick={handleBulkComplete}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Mark Completed
            </button>
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Delete Bulk
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-gray-400 hover:text-white px-3 py-2 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bookings Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm text-left">
            <thead className="bg-[#141414] text-gray-400 font-semibold uppercase tracking-wider text-xs border-b border-gray-800">
              <tr>
                <th className="px-4 py-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={filteredBookings.length > 0 && selectedIds.length === filteredBookings.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 accent-red-600 cursor-pointer rounded"
                  />
                </th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Vehicle Type</th>
                <th className="px-6 py-4">Wash Package</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Assigned To</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-850">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-10 text-center text-gray-500">
                    Loading bookings...
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-10 text-center text-gray-500">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-[#121212]/40 transition-colors">
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(booking.id)}
                        onChange={() => handleSelectRow(booking.id)}
                        className="w-4 h-4 accent-red-600 cursor-pointer rounded"
                      />
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">
                      {booking.customerName}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-300">
                      {booking.phoneNumber}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-zinc-900 border border-zinc-800 text-gray-300 text-xs px-2.5 py-1 rounded-md font-medium uppercase">
                        {booking.vehicleType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{booking.serviceType}</div>
                      {booking.addons && booking.addons.length > 0 && (
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          Addons: {booking.addons.join(", ")}
                        </div>
                      )}
                      {booking.pickupDrop && (
                        <div className="text-[11px] text-red-500 font-bold mt-0.5">
                          ✓ Include Pickup & Delivery
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      <div>{booking.bookingDate}</div>
                      <div className="text-xs text-gray-500 mt-0.5 font-mono">{booking.bookingTime}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold border ${
                          booking.status === "Completed" || booking.status === "Delivered"
                            ? "bg-green-950/40 text-green-400 border-green-800/40"
                            : ["Assigned", "Washing"].includes(booking.status)
                            ? "bg-blue-950/40 text-blue-400 border-blue-800/40"
                            : "bg-yellow-950/40 text-yellow-400 border-yellow-800/40"
                        }`}
                      >
                        <span
                          className={`w-1 h-1 rounded-full ${
                            booking.status === "Completed" || booking.status === "Delivered"
                              ? "bg-green-400"
                              : ["Assigned", "Washing"].includes(booking.status)
                              ? "bg-blue-400"
                              : "bg-yellow-400"
                          }`}
                        />
                        {booking.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {booking.assignedEmployeeName ? (
                        <div className="flex items-center gap-1.5 text-white font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          {booking.assignedEmployeeName}
                        </div>
                      ) : (
                        <span className="text-gray-600 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-green-400 font-bold font-mono">
                      ₹{booking.totalCost}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setDrawerData(booking);
                          setEmpQuery(booking.assignedEmployeeName || "");
                          setAssignReason("");
                        }}
                        className="bg-[#222] hover:bg-red-600 hover:text-white transition text-gray-300 font-semibold px-4 py-2 rounded-lg text-xs"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Slide-over Booking Management Drawer */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setSelectedBooking(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Body */}
          <div className="relative w-full max-w-xl bg-[#0d0d0d] border-l border-gray-800 shadow-2xl h-full flex flex-col z-10">
            {/* Header */}
            <div className="p-6 border-b border-gray-850 flex items-center justify-between bg-[#111]">
              <div>
                <span className="font-mono text-xs font-semibold text-red-500 uppercase tracking-wider">
                  Order Dispatch Console
                </span>
                <h2 className="text-2xl font-bold text-white mt-1">
                  Manage Booking
                </h2>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800/50 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Order Card summary */}
              <div className="bg-black p-4 rounded-xl border border-gray-850 space-y-3">
                <div className="flex justify-between items-center text-xs text-gray-500 font-mono">
                  <span>ID: {selectedBooking.id.toUpperCase()}</span>
                  <span>STATUS: {drawerData.status || "Pending"}</span>
                </div>
                <div className="border-t border-gray-850 pt-2 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase">Customer</div>
                    <div className="text-sm font-semibold text-white mt-0.5">{selectedBooking.customerName}</div>
                    <div className="text-xs text-gray-400 font-mono">{selectedBooking.phoneNumber}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase">Schedule</div>
                    <div className="text-sm font-semibold text-white mt-0.5">{selectedBooking.bookingDate}</div>
                    <div className="text-xs text-gray-400 font-mono">{selectedBooking.bookingTime}</div>
                  </div>
                </div>
              </div>

              {/* Service & Configuration details */}
              <div className="space-y-4">
                <h3 className="text-red-500 text-xs font-bold uppercase tracking-wider border-b border-gray-850 pb-2">
                  Service Config Details
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-500 text-xs font-semibold block">Vehicle Category</label>
                    <div className="text-white text-sm font-bold bg-[#141414] p-3 rounded-lg border border-gray-850 uppercase mt-1">
                      {selectedBooking.vehicleType}
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs font-semibold block">Main Service Package</label>
                    <div className="text-white text-sm font-bold bg-[#141414] p-3 rounded-lg border border-gray-850 mt-1">
                      {selectedBooking.serviceType}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-gray-500 text-xs font-semibold block">Addons Included</label>
                  <div className="text-gray-300 text-sm bg-[#141414] p-3 rounded-lg border border-gray-850 mt-1">
                    {selectedBooking.addons?.join(", ") || "No add-on services selected."}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[#111] border border-gray-850">
                  <input
                    type="checkbox"
                    checked={selectedBooking.pickupDrop}
                    readOnly
                    className="w-4 h-4 accent-red-600 cursor-not-allowed"
                  />
                  <div>
                    <div className="text-sm font-semibold text-white">Pickup & Delivery Status</div>
                    <div className="text-[11px] text-gray-500">Determined during booking generation.</div>
                  </div>
                </div>
              </div>

              {/* Operational Dispatch / Status Edit */}
              <div className="space-y-4">
                <h3 className="text-red-500 text-xs font-bold uppercase tracking-wider border-b border-gray-850 pb-2">
                  Operational Control
                </h3>

                {/* Status selector */}
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-xs font-semibold">Update Order Status</label>
                  <select
                    value={drawerData.status || "Pending"}
                    onChange={(e) => setDrawerData({ ...drawerData, status: e.target.value })}
                    className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none mt-1"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Washing">Washing</option>
                    <option value="Completed">Completed</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>

                {/* Employee assignment autocomplete dropdown */}
                <div className="flex flex-col gap-1 relative" ref={empRef}>
                  <div className="flex items-center justify-between">
                    <label className="text-gray-500 text-xs font-semibold">Assign Detailing Professional</label>
                    <button
                      type="button"
                      onClick={handleAutoAssign}
                      className="text-xs text-red-500 hover:text-red-400 font-bold hover:underline cursor-pointer bg-transparent border-0 outline-none"
                    >
                      💡 Auto-Assign Best Staff
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Search staff by name or code..."
                    value={empQuery}
                    onChange={(e) => {
                      setEmpQuery(e.target.value);
                      setShowEmpDropdown(true);
                    }}
                    onFocus={() => setShowEmpDropdown(true)}
                    className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none mt-1"
                  />
                  {assignReason && (
                    <p className="text-xs text-gray-400 mt-1 italic font-medium">{assignReason}</p>
                  )}

                  {showEmpDropdown && (
                    <div className="absolute left-0 right-0 z-20 mt-1 top-full max-h-48 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setDrawerData({
                            ...drawerData,
                            assignedEmployeeId: null,
                            assignedEmployeeName: "",
                          });
                          setEmpQuery("");
                          setShowEmpDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2.5 hover:bg-zinc-800 border-b border-zinc-800 text-red-500 font-bold text-xs"
                      >
                        [ Clear Assignment / Unassign ]
                      </button>
                      {filteredEmployees.length === 0 ? (
                        <div className="p-3 text-gray-500 text-xs text-center">No matching staff found.</div>
                      ) : (
                        filteredEmployees.map((emp) => (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => {
                              setDrawerData({
                                ...drawerData,
                                assignedEmployeeId: emp.id,
                                assignedEmployeeName: emp.name,
                              });
                              setEmpQuery(emp.name);
                              setShowEmpDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-zinc-800 text-sm"
                          >
                            <span className="font-semibold text-white">{emp.name}</span>
                            {emp.employeeCode && (
                              <span className="text-xs text-gray-500 ml-1.5 font-mono">({emp.employeeCode})</span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Amount pricing config */}
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-xs font-semibold">Adjust Cost / Final Price (₹)</label>
                  <input
                    type="number"
                    value={drawerData.totalCost || 0}
                    onChange={(e) => setDrawerData({ ...drawerData, totalCost: Number(e.target.value) })}
                    className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none font-mono mt-1"
                  />
                </div>
              </div>

              {/* Advanced Invoice Options */}
              <div className="p-4 rounded-xl border border-red-950/20 bg-red-950/5 space-y-3">
                <h4 className="text-red-500 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Invoice & Billing Services
                </h4>
                <p className="text-gray-500 text-[11px]">
                  Generate a professional PDF Invoice Receipt for client hand-off or printing.
                </p>
                <button
                  type="button"
                  onClick={() => downloadInvoice(selectedBooking)}
                  className="bg-transparent hover:bg-red-600 hover:text-white border border-red-900/50 hover:border-red-600 transition text-red-400 font-semibold px-4 py-2.5 rounded-lg text-xs w-full"
                >
                  Download PDF Invoice Receipt
                </button>
              </div>

              {/* Danger Zone */}
              <div className="p-4 rounded-xl border border-red-950/30 bg-red-950/10 space-y-3">
                <h4 className="text-red-500 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  Danger Action Zone
                </h4>
                <p className="text-gray-500 text-[11px]">
                  Permanently wipe this order booking record from database registry.
                </p>
                <button
                  type="button"
                  onClick={() => handleDelete(selectedBooking.id)}
                  className="bg-red-950/30 hover:bg-red-600 transition text-red-500 hover:text-white border border-red-900/30 hover:border-red-650 px-4 py-2.5 rounded-lg text-xs font-semibold w-full"
                >
                  Delete Booking Record
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-850 flex items-center justify-end gap-3 bg-[#111]">
              <button
                onClick={() => setSelectedBooking(null)}
                disabled={savingDrawer}
                className="bg-transparent hover:bg-gray-800 border border-gray-800 text-gray-300 font-semibold px-5 py-2.5 rounded-lg text-sm transition"
              >
                Close
              </button>
              <button
                onClick={handleSaveDrawer}
                disabled={savingDrawer}
                className="bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all text-white font-semibold px-6 py-2.5 rounded-lg text-sm shadow-md"
              >
                {savingDrawer ? "Saving updates..." : "Save Details"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
