"use client";

import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Card from "@/components/ui/Card";
import Link from "next/link";

interface Customer {
  id: string;
  customerName: string;
  phoneNumber: string;
  email: string | null;
  totalVisits: number;
  totalSpent: number;
  lastVisit: string | null;
  tag: string | null;
}

export default function InactiveCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [campaignLogs, setCampaignLogs] = useState<Record<string, string>>({});

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/customers");
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
      } else {
        setError(data.message || "Failed to fetch customers");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to CRM API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter for VIP/Repeat customers who haven't visited in > 45 days
  const inactiveVips = useMemo(() => {
    const fortyFiveDaysAgo = new Date().getTime() - 45 * 24 * 60 * 60 * 1000;
    return customers
      .filter((c) => {
        if (c.totalVisits < 2) return false; // repeat customers only
        if (!c.lastVisit) return true; // never visited
        return new Date(c.lastVisit).getTime() < fortyFiveDaysAgo;
      })
      .sort((a, b) => b.totalSpent - a.totalSpent); // higher spent first
  }, [customers]);

  const handleSendCoupon = async (customer: Customer) => {
    try {
      const promoCode = `WELCOMEBACK_${customer.phoneNumber.slice(-4)}`;
      
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Win-Back Offer for ${customer.customerName}`,
          description: `Custom win-back coupon generated for client ${customer.phoneNumber}`,
          discountPercent: 15,
          discountAmount: 0,
          validDays: [],
          startTime: "",
          endTime: "",
          applicableServiceIds: [],
          minVehicles: 1,
          discountSecondVehicleAmount: 0,
          code: promoCode,
          isActive: true,
          validUntil: new Date(new Date().getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days validity
        }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setCampaignLogs((prev) => ({
          ...prev,
          [customer.id]: `Coupon code '${promoCode}' created & sent via SMS! (Expires in 15 days)`,
        }));
        alert(`Successfully generated and dispatched win-back coupon code: ${promoCode} to ${customer.customerName}!`);
      } else {
        alert(data.message || "Failed to create win-back coupon");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending campaign coupon");
    }
  };

  return (
    <DashboardLayout title="Win-Back Campaigns">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Inactive VIP CRM Win-Back</h2>
          <p className="text-sm text-gray-400 mt-1">Select high-value clients who haven't visited in the last 45+ days to prompt engagement.</p>
        </div>
        <Link href="/admin/customers" className="bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-sm font-semibold px-4 py-2 rounded-xl transition">
          Back to CRM
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#111] p-5 rounded-xl border border-gray-800 flex flex-col justify-between">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total CRM Reach</span>
          <span className="text-3xl font-bold mt-2 text-white">{customers.length} Clients</span>
        </div>
        <div className="bg-[#1a1111] p-5 rounded-xl border border-red-950 flex flex-col justify-between">
          <span className="text-red-500 text-xs font-semibold uppercase tracking-wider">Inactive VIPs (&gt;45 days)</span>
          <span className="text-3xl font-bold mt-2 text-red-400">{inactiveVips.length} Clients</span>
        </div>
        <div className="bg-[#111a11] p-5 rounded-xl border border-green-950 flex flex-col justify-between">
          <span className="text-green-500 text-xs font-semibold uppercase tracking-wider">Campaign Dispatches</span>
          <span className="text-3xl font-bold mt-2 text-green-400">{Object.keys(campaignLogs).length} Sent</span>
        </div>
      </div>

      <Card>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#141414] text-gray-400 font-semibold uppercase tracking-wider text-xs border-b border-gray-800">
              <tr>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Phone / Contact</th>
                <th className="px-6 py-4">Last Visit</th>
                <th className="px-6 py-4">Visits count</th>
                <th className="px-6 py-4">Total Spent</th>
                <th className="px-6 py-4 text-right">Win-Back Campaigns</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-850">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    Scanning database...
                  </td>
                </tr>
              ) : inactiveVips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    No inactive VIP clients found! All are currently active.
                  </td>
                </tr>
              ) : (
                inactiveVips.map((c) => (
                  <tr key={c.id} className="hover:bg-[#121212]/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">
                      {c.customerName}
                      {c.tag && (
                        <span className="bg-red-950/40 text-red-400 text-[10px] font-bold px-2 py-0.5 ml-2 rounded-full border border-red-800/40 uppercase">
                          {c.tag}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-300">
                      <div>{c.phoneNumber}</div>
                      {c.email && <div className="text-[11px] text-gray-500 font-sans">{c.email}</div>}
                    </td>
                    <td className="px-6 py-4 text-yellow-500/80 font-medium">
                      {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : "N/A"}
                      <div className="text-xs text-gray-500 font-normal mt-0.5">
                        ({Math.round((new Date().getTime() - new Date(c.lastVisit || 0).getTime()) / (24 * 60 * 60 * 1000))} days ago)
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">{c.totalVisits}</td>
                    <td className="px-6 py-4 text-green-400 font-bold font-mono">₹{c.totalSpent}</td>
                    <td className="px-6 py-4 text-right">
                      {campaignLogs[c.id] ? (
                        <div className="text-xs text-green-400 font-semibold italic flex flex-col items-end">
                          <span>✓ Sent</span>
                          <span className="text-[10px] text-gray-500 font-normal mt-0.5">{campaignLogs[c.id]}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSendCoupon(c)}
                          className="bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-md cursor-pointer"
                        >
                          🎁 Send 15% Win-back Code
                        </button>
                      )}
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
