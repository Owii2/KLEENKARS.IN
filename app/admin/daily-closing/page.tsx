"use client";

import { useEffect, useMemo, useState } from "react";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Card from "@/components/ui/Card";
import KpiCard from "@/components/ui/KpiCard";

interface DailyClosing {
  id: string;
  date: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalBookings: number;
  cashRevenue: number;
  upiRevenue: number;
  cashClosingAfterExpenses?: number | null;
  dailyWageDeductions?: number | null;
  onlinePaymentCollected?: number | null;
}

export default function DailyClosingPage() {
  const [closings, setClosings] = useState<DailyClosing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchClosings = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/daily-closing");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load closings");
      }

      setClosings(data.closings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load closings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClosings();
  }, []);

  const generateClosing = async () => {
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/daily-closing", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not generate closing");
      }

      fetchClosings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate closing");
    } finally {
      setSaving(false);
    }
  };

  const totalProfit = useMemo(
    () => closings.reduce((sum, item) => sum + item.netProfit, 0),
    [closings]
  );
  const totalRevenue = useMemo(
    () => closings.reduce((sum, item) => sum + item.totalRevenue, 0),
    [closings]
  );
  const totalExpenses = useMemo(
    () => closings.reduce((sum, item) => sum + item.totalExpenses, 0),
    [closings]
  );

  return (
    <DashboardLayout title="Daily Closing">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <p className="text-gray-400">Cash, UPI, expenses, and net profit.</p>
        <button
          onClick={generateClosing}
          disabled={saving}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 px-6 py-3 rounded-lg"
        >
          {saving ? "Generating..." : "Generate Today's Closing"}
        </button>
      </div>

      {error ? <Card className="mb-8 text-red-400">{error}</Card> : null}

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <KpiCard label="Total Revenue" value={`Rs. ${totalRevenue}`} color="text-green-400" />
        <KpiCard label="Total Expenses" value={`Rs. ${totalExpenses}`} color="text-red-400" />
        <KpiCard label="Net Profit" value={`Rs. ${totalProfit}`} color="text-blue-400" />
      </div>

      <div className="space-y-6">
        {loading ? (
          <Card>Loading closings...</Card>
        ) : closings.length === 0 ? (
          <Card>No daily closings generated yet.</Card>
        ) : (
          closings.map((closing) => (
            <Card key={closing.id}>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{closing.date}</h2>
                  <p className="text-gray-400">{closing.totalBookings} Bookings</p>
                </div>
                <div className="text-green-400 text-3xl font-bold">
                  Rs. {closing.netProfit}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-black p-4 rounded-lg">
                  <p className="text-gray-400">Revenue</p>
                  <p className="text-2xl font-bold text-green-400">
                    Rs. {closing.totalRevenue}
                  </p>
                </div>
                <div className="bg-black p-4 rounded-lg">
                  <p className="text-gray-400">Expenses</p>
                  <p className="text-2xl font-bold text-red-400">
                    Rs. {closing.totalExpenses}
                  </p>
                </div>
                <div className="bg-black p-4 rounded-lg">
                  <p className="text-gray-400">Cash Revenue</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    Rs. {closing.cashRevenue}
                  </p>
                </div>
                <div className="bg-black p-4 rounded-lg">
                  <p className="text-gray-400">UPI Revenue</p>
                  <p className="text-2xl font-bold text-blue-400">
                    Rs. {closing.upiRevenue}
                  </p>
                </div>
              </div>

              {/* Supervisor Submissions */}
              {(closing.cashClosingAfterExpenses !== undefined && closing.cashClosingAfterExpenses !== null ||
                closing.dailyWageDeductions !== undefined && closing.dailyWageDeductions !== null ||
                closing.onlinePaymentCollected !== undefined && closing.onlinePaymentCollected !== null) && (
                <div className="mt-6 pt-6 border-t border-white/5">
                  <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Supervisor Closing Report</h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="bg-[#111] border border-gray-800 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Cash Closing (After Expenses)</p>
                      <p className="text-xl font-bold text-yellow-300">
                        Rs. {closing.cashClosingAfterExpenses ?? 0}
                      </p>
                    </div>
                    <div className="bg-[#111] border border-gray-800 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Daily Wage Deductions</p>
                      <p className="text-xl font-bold text-red-300">
                        Rs. {closing.dailyWageDeductions ?? 0}
                      </p>
                    </div>
                    <div className="bg-[#111] border border-gray-800 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Online Payments Collected</p>
                      <p className="text-xl font-bold text-blue-300">
                        Rs. {closing.onlinePaymentCollected ?? 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
