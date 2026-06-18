"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Card from "@/components/ui/Card";
import KpiCard from "@/components/ui/KpiCard";

interface Booking {
  id: string;
  customerName: string;
  serviceType: string;
  totalCost: number;
  pickupDrop: boolean;
  status: string;
  createdAt: string;
}

interface Employee {
  id: string;
  role: string;
  status: string;
}

const quickLinks = [
  { href: "/admin/bookings", label: "Bookings", description: "Manage all bookings" },
  { href: "/admin/employees", label: "Employees", description: "Manage employee accounts" },
  { href: "/admin/attendance", label: "Attendance", description: "Track daily staff attendance" },
  { href: "/admin/customer", label: "Customers", description: "CRM and repeat customers" },
  { href: "/admin/expenses", label: "Expenses", description: "Track operational costs" },
  { href: "/admin/franchise", label: "Franchise", description: "Review franchise applications" },
  { href: "/admin/daily-closing", label: "Daily Closing", description: "Close revenue and expenses" },
];

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const [bookingsResponse, employeesResponse] = await Promise.all([
          fetch("/api/bookings"),
          fetch("/api/employees"),
        ]);
        const bookingsData = await bookingsResponse.json();
        const employeesData = await employeesResponse.json();

        if (!bookingsResponse.ok) {
          throw new Error(bookingsData.message || "Failed to load bookings");
        }

        if (!employeesResponse.ok) {
          throw new Error(employeesData.message || "Failed to load employees");
        }

        setBookings(bookingsData.bookings || []);
        setEmployees(employeesData.employees || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const totalRevenue = useMemo(
    () => bookings.reduce((sum, booking) => sum + booking.totalCost, 0),
    [bookings]
  );
  const averageTicket = bookings.length ? Math.round(totalRevenue / bookings.length) : 0;
  const pendingBookings = bookings.filter((booking) => booking.status === "Pending").length;
  const inProgress = bookings.filter((booking) =>
    ["Assigned", "Washing"].includes(booking.status)
  ).length;
  const completedJobs = bookings.filter((booking) =>
    ["Completed", "Delivered"].includes(booking.status)
  ).length;
  const pickupCount = bookings.filter((booking) => booking.pickupDrop).length;
  const presentStaff = employees.filter((employee) => employee.status === "active").length;
  const absentStaff = Math.max(employees.length - presentStaff, 0);
  const activeSupervisors = employees.filter(
    (employee) => employee.role === "supervisor" && employee.status === "active"
  ).length;

  const serviceRevenue = useMemo(() => {
    return bookings.reduce<Record<string, number>>((stats, booking) => {
      stats[booking.serviceType] = (stats[booking.serviceType] || 0) + booking.totalCost;
      return stats;
    }, {});
  }, [bookings]);

  const monthlyRevenue = useMemo(() => {
    return bookings.reduce<Record<string, number>>((stats, booking) => {
      const month = new Date(booking.createdAt).toLocaleString("default", {
        month: "short",
      });
      stats[month] = (stats[month] || 0) + booking.totalCost;
      return stats;
    }, {});
  }, [bookings]);

  return (
    <DashboardLayout title="Admin Dashboard">
      {error ? <Card className="mb-8 text-red-400">{error}</Card> : null}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
        {quickLinks.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:border-red-500 transition cursor-pointer h-full">
              <h2 className="text-xl font-bold mb-2">{item.label}</h2>
              <p className="text-gray-400">{item.description}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <KpiCard label="Total Revenue" value={`Rs. ${totalRevenue}`} color="text-green-400" />
        <KpiCard label="Total Bookings" value={bookings.length} color="text-blue-400" />
        <KpiCard label="Avg Ticket Size" value={`Rs. ${averageTicket}`} color="text-yellow-400" />
        <KpiCard label="Pickup Requests" value={pickupCount} color="text-red-400" />
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <KpiCard label="Pending Bookings" value={pendingBookings} color="text-yellow-400" />
        <KpiCard label="Cars In Progress" value={inProgress} color="text-blue-400" />
        <KpiCard label="Completed Jobs" value={completedJobs} color="text-green-400" />
        <KpiCard label="Present Staff" value={presentStaff} color="text-green-400" />
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
        <KpiCard label="Absent Staff" value={absentStaff} color="text-red-400" />
        <KpiCard label="Active Supervisors" value={activeSupervisors} color="text-blue-400" />
        <KpiCard label="Dashboard State" value={loading ? "Loading" : "Live"} color="text-white" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-bold mb-6 text-red-400">Monthly Revenue Trend</h2>
          {Object.keys(monthlyRevenue).length === 0 ? (
            <p className="text-gray-400">No revenue data yet.</p>
          ) : (
            <div className="space-y-5">
              {Object.entries(monthlyRevenue).map(([month, revenue]) => (
                <div key={month}>
                  <div className="flex justify-between mb-2">
                    <span>{month}</span>
                    <span className="font-bold text-green-400">Rs. {revenue}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div
                      className="bg-red-500 h-3 rounded-full"
                      style={{ width: `${Math.min(revenue / 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-6 text-red-400">Service-wise Revenue</h2>
          {Object.keys(serviceRevenue).length === 0 ? (
            <p className="text-gray-400">No service data yet.</p>
          ) : (
            <div className="space-y-5">
              {Object.entries(serviceRevenue).map(([service, revenue]) => (
                <div key={service}>
                  <div className="flex justify-between mb-2">
                    <span>{service}</span>
                    <span className="font-bold text-green-400">Rs. {revenue}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full"
                      style={{ width: `${Math.min(revenue / 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-6 text-red-400">Recent Bookings</h2>
          {bookings.length === 0 ? (
            <p className="text-gray-400">No bookings found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="bg-red-600">
                    <th className="p-3 text-left">Customer</th>
                    <th className="p-3 text-left">Service</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.slice(0, 8).map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-800">
                      <td className="p-3">{booking.customerName}</td>
                      <td className="p-3">{booking.serviceType}</td>
                      <td className="p-3">{booking.status}</td>
                      <td className="p-3 text-green-400">Rs. {booking.totalCost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
