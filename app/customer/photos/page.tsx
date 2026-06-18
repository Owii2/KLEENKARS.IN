"use client";

import { useEffect, useMemo, useState } from "react";

interface CustomerUser {
  phone: string;
}

interface StoredBooking {
  id: string;
  phone: string;
  date?: string;
  service?: string;
  serviceType?: string;
}

export default function PhotosPage() {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [bookings, setBookings] = useState<StoredBooking[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("customerUser");
    setUser(storedUser ? (JSON.parse(storedUser) as CustomerUser) : null);
    setBookings(JSON.parse(localStorage.getItem("bookings") || "[]") as StoredBooking[]);
  }, []);

  const myBookings = useMemo(() => {
    return bookings.filter((booking) => booking.phone === user?.phone);
  }, [bookings, user]);

  if (!user) {
    return <div className="p-6 text-gray-400">Please login</div>;
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Before / After Photos</h1>
        <div className="bg-zinc-900 rounded p-4">
          {myBookings.length === 0 ? (
            <p className="text-gray-400">No photos available yet.</p>
          ) : (
            myBookings.map((booking) => (
              <div key={booking.id} className="mb-6">
                <div className="font-semibold mb-2">
                  {booking.date || "-"} - {booking.serviceType || booking.service || "Service"}
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="text-gray-400">Before photos pending</div>
                  <div className="text-gray-400">After photos pending</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
