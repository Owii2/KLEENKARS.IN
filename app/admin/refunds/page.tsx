"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface Refund {
  id: string;
  bookingId: string;
  bookingRef: string;
  customerName: string;
  amount: number;
  reason: string;
  paymentMode: string;
  status: string;
  createdAt: string;
}

interface Booking {
  id: string;
  customerName: string;
  totalCost: number;
  status: string;
  bookingDate: string;
  phoneNumber: string;
}

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSearch, setBookingSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [refundsRes, bookingsRes] = await Promise.all([
        fetch("/api/refunds"),
        fetch("/api/bookings"),
      ]);

      const refundsData = await refundsRes.json();
      const bookingsData = await bookingsRes.json();

      setRefunds(refundsData.refunds || []);
      setBookings(bookingsData.bookings || []);
    } catch (err) {
      console.error("Error fetching refunds/bookings data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter bookings list based on search text (only show eligible ones)
  const filteredBookings = bookings.filter((b) => {
    const query = bookingSearch.toLowerCase();
    const matchesSearch =
      b.customerName.toLowerCase().includes(query) ||
      b.id.toLowerCase().includes(query) ||
      b.phoneNumber.includes(query);
    return matchesSearch && b.status !== "Cancelled";
  });

  const selectedBooking = bookings.find((b) => b.id === selectedBookingId);

  const handleIssueRefund = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBookingId) {
      alert("Please select a booking to refund.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      alert("Please specify a valid refund amount.");
      return;
    }
    if (selectedBooking && Number(amount) > selectedBooking.totalCost) {
      alert(`Refund amount cannot exceed the booking value of ₹${selectedBooking.totalCost}`);
      return;
    }
    if (!reason.trim()) {
      alert("Please provide a reason for the refund.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedBookingId,
          amount: Number(amount),
          reason: reason.trim(),
          paymentMode,
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        alert("Refund processed successfully!");
        setSelectedBookingId("");
        setAmount("");
        setReason("");
        setBookingSearch("");
        fetchData();
      } else {
        alert(resData.message || "Failed to process refund.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while processing refund.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRefund = async (id: string) => {
    if (!confirm("Are you sure you want to delete this refund record? This is for logging purposes and will NOT undo the booking cancellation or customer balance updates.")) {
      return;
    }

    try {
      const response = await fetch(`/api/refunds/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert("Refund record deleted.");
        fetchData();
      } else {
        alert(data.message || "Failed to delete record.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting record.");
    }
  };

  return (
    <DashboardLayout title="Refunds Processing Center">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-red-500">
          Refund Center
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Issue transaction refunds, verify booking receipts, and maintain clear ledger records.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form to Issue Refund */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0b0b0b] border border-gray-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
              </svg>
              Issue Refund
            </h2>
            <form onSubmit={handleIssueRefund} className="space-y-4">
              {/* Search booking */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                  Find Booking (Name/Phone/ID)
                </label>
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 text-sm transition"
                />
              </div>

              {/* Selection dropdown */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                  Select Booking *
                </label>
                <select
                  value={selectedBookingId}
                  onChange={(e) => {
                    setSelectedBookingId(e.target.value);
                    const booking = bookings.find((b) => b.id === e.target.value);
                    if (booking) {
                      setAmount(String(booking.totalCost));
                    } else {
                      setAmount("");
                    }
                  }}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 text-sm transition"
                >
                  <option value="">-- Choose Booking --</option>
                  {filteredBookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.customerName} - ₹{b.totalCost} ({b.id.substring(0, 8).toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Display selected booking info */}
              {selectedBooking && (
                <div className="bg-[#111] p-4 rounded-xl border border-gray-850 space-y-2 text-xs text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Customer:</span>
                    <span className="font-semibold text-white">{selectedBooking.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone:</span>
                    <span className="font-mono text-white">{selectedBooking.phoneNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span>{selectedBooking.bookingDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Original Amount:</span>
                    <span className="font-bold text-green-400 font-mono">₹{selectedBooking.totalCost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Current Status:</span>
                    <span className="uppercase text-amber-500 font-semibold">{selectedBooking.status}</span>
                  </div>
                </div>
              )}

              {/* Amount input */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                  Refund Amount (₹) *
                </label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 font-mono text-sm transition"
                />
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                  Mode of Refund *
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 text-sm transition"
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Cash">Cash Payout</option>
                  <option value="Bank Transfer">Net Banking Transfer</option>
                  <option value="Card">Credit/Debit Card Refund</option>
                </select>
              </div>

              {/* Reason input */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                  Reason for Refund *
                </label>
                <textarea
                  placeholder="e.g. Customer cancelled 24 hours prior, service issue..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-red-600 text-sm transition"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all text-white font-bold py-3 rounded-xl shadow-lg shadow-red-900/30 flex items-center justify-center gap-2 text-sm"
              >
                {isSubmitting ? "Processing..." : "Confirm & Send Payout"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Refund Logs List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0b0b0b] border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-850 flex items-center justify-between bg-[#111]/40">
              <h2 className="text-xl font-bold text-white">Refund History Logs</h2>
              <span className="text-xs font-mono font-semibold bg-red-950/40 border border-red-900 text-red-400 px-3 py-1 rounded-full">
                {refunds.length} total logs
              </span>
            </div>

            {loading ? (
              <div className="py-20 text-center text-gray-500">
                Loading transaction records...
              </div>
            ) : refunds.length === 0 ? (
              <div className="py-16 text-center text-gray-500 text-sm">
                No refunds processed yet. Use the layout panel to file one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#141414] text-gray-400 font-semibold uppercase tracking-wider text-xs border-b border-gray-800">
                    <tr>
                      <th className="px-6 py-4">Booking Ref</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Reason</th>
                      <th className="px-6 py-4">Payment Mode</th>
                      <th className="px-6 py-4">Processed On</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-850">
                    {refunds.map((ref) => (
                      <tr key={ref.id} className="hover:bg-[#121212]/40 transition-colors">
                        <td className="px-6 py-4 font-mono font-semibold text-red-400">
                          #{ref.bookingRef}
                        </td>
                        <td className="px-6 py-4 text-white font-semibold">
                          {ref.customerName}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-red-400">
                          -₹{ref.amount}
                        </td>
                        <td className="px-6 py-4 text-gray-400 max-w-[150px] truncate" title={ref.reason}>
                          {ref.reason}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-[#1e1e1e] text-gray-300 text-xs px-2.5 py-1 rounded-full font-medium border border-gray-800">
                            {ref.paymentMode}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          {new Date(ref.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteRefund(ref.id)}
                            className="text-red-500 hover:text-red-400 font-semibold text-xs bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
