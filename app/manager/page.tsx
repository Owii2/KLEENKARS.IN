"use client";

import { useEffect, useState } from "react";

interface Booking {
  id: string;
  customerName: string;
  vehicleType: string;
  serviceType: string;
  bookingDate: string;
  totalCost: number;
  status: string;
  assignedEmployeeName?: string | null;
}

interface Employee {
  id: string;
  name: string;
  role: string;
}

export default function ManagerPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const fetchData = async () => {
    const [bookingRes, employeeRes] = await Promise.all([
      fetch("/api/bookings"),
      fetch("/api/employees"),
    ]);
    const bookingData = await bookingRes.json();
    const employeeData = await employeeRes.json();

    setBookings(bookingData.bookings || []);
    setEmployees(employeeData.employees || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const assignBooking = async (bookingId: string, employeeId: string) => {
    const employee = employees.find((item) => item.id === employeeId);

    if (!employee) {
      return;
    }

    await fetch(`/api/bookings/${bookingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignedEmployeeId: employee.id,
        assignedEmployeeName: employee.name,
        status: "Assigned",
      }),
    });

    fetchData();
  };

  return (
    <div className="min-h-full text-white p-6">
      <h1 className="text-4xl font-bold text-red-500 mb-8">Manager Dashboard</h1>

      <div className="space-y-6">
        {bookings.map((booking) => (
          <div key={booking.id} className="glass-panel p-5">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-bold text-white">{booking.customerName}</h2>
                <p className="text-gray-400">{booking.vehicleType}</p>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm w-fit ${
                  booking.status === "Pending"
                    ? "bg-yellow-600"
                    : booking.status === "Assigned"
                    ? "bg-blue-600"
                    : booking.status === "Completed"
                    ? "bg-green-600"
                    : "bg-gray-600"
                }`}
              >
                {booking.status}
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-5">
              <div>
                <p className="text-gray-400">Service</p>
                <p>{booking.serviceType}</p>
              </div>
              <div>
                <p className="text-gray-400">Date</p>
                <p>{booking.bookingDate}</p>
              </div>
              <div>
                <p className="text-gray-400">Amount</p>
                <p>Rs. {booking.totalCost}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
              <select
                onChange={(e) => assignBooking(booking.id, e.target.value)}
                className="bg-black border border-gray-700 p-3 rounded-lg"
                defaultValue=""
              >
                <option value="" disabled>
                  Assign Staff
                </option>
                {employees
                  .filter((employee) => employee.role !== "manager")
                  .map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} ({employee.role})
                    </option>
                  ))}
              </select>

              {booking.assignedEmployeeName ? (
                <div className="text-green-400">Assigned To: {booking.assignedEmployeeName}</div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
