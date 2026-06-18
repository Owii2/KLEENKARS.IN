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
}

export default function StaffPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  const fetchBookings = async () => {
    const response = await fetch("/api/bookings");
    const data = await response.json();

    setBookings(data.bookings || []);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const updateStatus = async (bookingId: string, status: string) => {
    await fetch(`/api/bookings/${bookingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    fetchBookings();
  };

  const activeBookings = bookings.filter((booking) => booking.status !== "Completed");

  return (
    <div className="min-h-full text-white p-6">
      <h1 className="text-4xl font-bold text-red-500 mb-8">Staff Dashboard</h1>

      <div className="space-y-6">
        {activeBookings.length === 0 ? (
          <div className="glass-panel p-5 text-gray-300">
            No active jobs assigned.
          </div>
        ) : (
          activeBookings.map((booking) => (
            <div key={booking.id} className="glass-panel p-5">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-2xl font-bold">{booking.customerName}</h2>
                  <p className="text-gray-400">{booking.vehicleType}</p>
                </div>
                <div className="text-green-400 text-xl font-bold">
                  Rs. {booking.totalCost}
                </div>
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
                  <p className="text-gray-400">Status</p>
                  <p>{booking.status}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => updateStatus(booking.id, "Washing")}
                  className="bg-blue-600 px-4 py-2 rounded"
                >
                  Start Wash
                </button>
                <button
                  onClick={() => updateStatus(booking.id, "Completed")}
                  className="bg-green-600 px-4 py-2 rounded"
                >
                  Complete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
