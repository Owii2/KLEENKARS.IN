"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface CustomerUser {
  phone: string;
}

interface Membership {
  planName: string;
  expiry: string;
  remaining: number;
  benefits: string[];
}

export default function MembershipPage() {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("customerUser");
    const parsedUser = stored ? (JSON.parse(stored) as CustomerUser) : null;
    setUser(parsedUser);

    if (parsedUser) {
      const storedMembership = window.localStorage.getItem(`membership_${parsedUser.phone}`);
      setMembership(storedMembership ? (JSON.parse(storedMembership) as Membership) : null);
    }
  }, []);

  const renew = () => {
    if (!user) return;

    const next: Membership = {
      planName: "Gold",
      expiry: "30 days from today",
      remaining: 12,
      benefits: ["Priority slot", "5% off"],
    };

    window.localStorage.setItem(`membership_${user.phone}`, JSON.stringify(next));
    setMembership(next);
    alert("Membership renewed");
  };

  if (!user) {
    return (
      <div className="p-6">
        Please <Link href="/customer/login">login</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-black text-white">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Membership</h1>
        <div className="p-4 bg-zinc-900 rounded">
          {membership ? (
            <div>
              <div className="font-bold">{membership.planName}</div>
              <div>Expiry: {membership.expiry}</div>
              <div>Remaining washes: {membership.remaining}</div>
              <div>Benefits: {membership.benefits.join(", ")}</div>
              <button onClick={renew} className="mt-3 px-4 py-2 bg-red-500 rounded">
                Renew Membership
              </button>
            </div>
          ) : (
            <div>
              No active membership.
              <button onClick={renew} className="ml-2 px-3 py-1 bg-red-500 rounded">
                Buy Gold
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
