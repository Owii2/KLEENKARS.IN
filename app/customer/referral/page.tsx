"use client";

import { useEffect, useState } from "react";

function generateCode(phone: string) {
  return "OWII" + phone.slice(-4);
}

export default function ReferralPage() {
  const [user, setUser] = useState<any>(null);
  const [code, setCode] = useState("");
  const [points, setPoints] = useState(0);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const s = window.localStorage.getItem("customerUser");
    const u = s ? JSON.parse(s) : null;
    setUser(u);
    if (u) {
      const stored = window.localStorage.getItem(`referral_${u.phone}`);
      const c = stored || generateCode(u.phone);
      setCode(c);
      window.localStorage.setItem(`referral_${u.phone}`, c);
      const pts = Number(window.localStorage.getItem(`referral_points_${u.phone}`) || 0);
      setPoints(pts);
    }
  }, []);

  const copy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    alert("Copied");
  };

  const redeemAll = async () => {
    if (!user) return alert("Login first");
    if (points <= 0) return alert("No points to redeem");
    if (!confirm(`Redeem ${points} points?`)) return;
    setRedeeming(true);
    try {
      const res = await fetch('/api/referrals/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: user.phone, points }) });
      const j = await res.json();
      if (j.success) {
        window.localStorage.setItem(`referral_points_${user.phone}`, '0');
        setPoints(0);
        alert('Redeemed successfully');
      } else {
        alert(j.message || 'Redeem failed');
      }
    } catch (err) {
      console.log(err);
      alert('Server error');
    } finally { setRedeeming(false); }
  };

  if (!user) return <div className="p-6 text-gray-400">Please login</div>;

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Referral Program</h1>
        <div className="glass-panel p-6">
          <div className="text-sm text-gray-400">Your referral code</div>
          <div className="flex items-center justify-between mt-3">
            <div className="text-2xl font-bold">{code}</div>
            <div className="flex gap-2">
              <button onClick={copy} className="bg-red-500 px-3 py-2 rounded">Copy</button>
            </div>
          </div>
          <p className="text-gray-400 mt-3">Share this code with friends. Both you and your friend get rewards when they redeem it.</p>
          <div className="mt-4">
            <div className="text-sm text-gray-400">Referral Points</div>
            <div className="text-2xl font-bold">{points}</div>
            <div className="mt-3">
              <button disabled={redeeming || points<=0} onClick={redeemAll} className="bg-green-600 px-4 py-2 rounded">Redeem All</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
