"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Card from "@/components/ui/Card";

interface ReferralReportItem {
  customer: {
    id: string;
    customerName: string;
    phoneNumber: string;
    referralCode: string | null;
    referralPoints: number;
  };
  redemptions: number;
}

interface ReferralReportResponse {
  success: boolean;
  report?: ReferralReportItem[];
}

export default function AdminReferrals() {
  const [list, setList] = useState<ReferralReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/referrals/report');
      const j = await res.json() as ReferralReportResponse;
      if (j.success) {
        setList(j.report || []);
      }
    } catch (error) {
      console.error("Failed to fetch referral report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const credit = async (phone: string) => {
    const pts = Number(prompt('Enter referral points to credit/debit (e.g. 50 or -20):') || '0');
    if (!pts) return;
    try {
      const res = await fetch('/api/admin/referrals/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, points: pts })
      });
      const j = await res.json();
      if (j.success) {
        alert(`Successfully adjusted points by ${pts} for ${phone}`);
        fetchReport();
      } else {
        alert(j.message || 'Failed to adjust points');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while crediting points');
    }
  };

  return (
    <DashboardLayout title="Referral & Loyalty Management">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Referral Leaderboard</h2>
          <p className="text-xs text-gray-400 mt-1">Track customer referral code performance and manually award credit points.</p>
        </div>
        <button
          onClick={fetchReport}
          className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition"
        >
          Refresh Data
        </button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm text-left">
            <thead className="bg-[#141414] text-gray-400 font-semibold uppercase tracking-wider text-xs border-b border-gray-800">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Referral Code</th>
                <th className="px-6 py-4">Loyalty Points</th>
                <th className="px-6 py-4">Total Redemptions</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-850">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    Loading referral details...
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    No active referral records found.
                  </td>
                </tr>
              ) : (
                list.map((item) => (
                  <tr key={item.customer.id} className="hover:bg-[#121212]/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">
                      {item.customer.customerName}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-300">
                      {item.customer.phoneNumber}
                    </td>
                    <td className="px-6 py-4">
                      {item.customer.referralCode ? (
                        <span className="font-mono bg-[#1e1e1e] text-red-400 text-xs px-2.5 py-1 rounded border border-gray-800 font-bold">
                          {item.customer.referralCode}
                        </span>
                      ) : (
                        <span className="text-gray-600 font-mono text-xs">NO CODE</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-green-400 font-bold font-mono">
                      {item.customer.referralPoints} pts
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {item.redemptions} redemptions
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {item.customer.referralCode && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.customer.referralCode || '');
                              alert('Code copied to clipboard!');
                            }}
                            className="bg-[#222] hover:bg-[#333] transition text-gray-300 font-semibold px-3 py-1.5 rounded text-xs"
                          >
                            Copy Code
                          </button>
                        )}
                        <button
                          onClick={() => credit(item.customer.phoneNumber)}
                          className="bg-red-650 hover:bg-red-600 transition text-white font-semibold px-3 py-1.5 rounded text-xs"
                        >
                          Credit Points
                        </button>
                      </div>
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
