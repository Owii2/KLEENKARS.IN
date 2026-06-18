"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function CustomerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [membership, setMembership] = useState<any>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralPoints, setReferralPoints] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("customerUser");
    const u = stored ? JSON.parse(stored) : null;
    setUser(u);
    if (u) {
      const all = JSON.parse(window.localStorage.getItem("bookings") || "[]");
      setBookings(all.filter((b: any) => b.phone === u.phone));
      const m = window.localStorage.getItem(`membership_${u.phone}`);
      setMembership(m ? JSON.parse(m) : null);
      const rc = window.localStorage.getItem(`referral_${u.phone}`);
      setReferralCode(rc);
      setReferralPoints(Number(window.localStorage.getItem(`referral_points_${u.phone}`) || 0));
    }
  }, []);

  const points = useMemo(() => bookings.reduce((sum, b) => sum + Math.floor((b.amount || 0) / 100), 0), [bookings]);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.localStorage.removeItem('customerUser');
    window.location.href = '/customer/login';
  };

  if (!user) return <div className="p-6 text-gray-400">Please <Link href="/customer/login">login</Link></div>;

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Hello, {user.name || user.phone}</h1>
          <button 
            onClick={handleLogout} 
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-red-400 font-bold rounded-lg transition"
          >
            Logout
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-zinc-900 rounded">
            <div className="text-sm text-gray-400">Membership</div>
            <div className="font-bold">{membership?.planName || "None"}</div>
          </div>
          <div className="p-4 bg-zinc-900 rounded">
            <div className="text-sm text-gray-400">Points</div>
            <div className="font-bold">{points}</div>
          </div>
          <div className="p-4 bg-zinc-900 rounded">
            <div className="text-sm text-gray-400">Referral Points</div>
            <div className="font-bold">{referralPoints}</div>
          </div>
        </div>

        <div className="p-4 bg-zinc-900 rounded">Quick links: <Link href="/customer/bookings">Bookings</Link> • <Link href="/customer/vehicles">Vehicles</Link> • <Link href="/customer/membership">Membership</Link></div>
      </div>
    </main>
  );
}
