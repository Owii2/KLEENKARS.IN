"use client";

import { useEffect, useMemo, useState } from "react";

interface CustomerUser {
  phone: string;
}

interface StoredBooking {
  phone: string;
  amount?: number;
  totalCost?: number;
}

export default function PointsPage() {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [bookings, setBookings] = useState<StoredBooking[]>([]);
  const [redeemed, setRedeemed] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem("customerUser");
    const parsedUser = storedUser ? (JSON.parse(storedUser) as CustomerUser) : null;
    setUser(parsedUser);
    setBookings(JSON.parse(localStorage.getItem("bookings") || "[]") as StoredBooking[]);

    if (parsedUser) {
      setRedeemed(Number(localStorage.getItem(`points_redeemed_${parsedUser.phone}`) || 0));
    }
  }, []);

  const earned = useMemo(() => {
    return bookings
      .filter((booking) => booking.phone === user?.phone)
      .reduce((sum, booking) => sum + Math.floor((booking.amount || booking.totalCost || 0) / 100), 0);
  }, [bookings, user]);

  if (!user) {
    return <div className="p-6 text-gray-400">Please login</div>;
  }

  return (
    <main className="min-h-screen p-6 bg-black text-white">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Loyalty Points</h1>
        <div className="p-4 bg-zinc-900 rounded">
          <div>Available Points: {earned - redeemed}</div>
          <div>Points Earned: {earned}</div>
          <div>Points Redeemed: {redeemed}</div>
        </div>
      </div>
    </main>
  );
}
