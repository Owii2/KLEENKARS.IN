"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  Mail,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Calendar,
  Layers,
  Send,
  Sparkles,
} from "lucide-react";

export default function BackupConsole() {
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [recipientEmail, setRecipientEmail] = useState<string>("owii.rajput@gmail.com");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  const monthsList = [
    { label: "🌐 All Months (Complete History)", value: "all" },
    { label: "August 2026", value: "2026-08" },
    { label: "July 2026", value: "2026-07" },
    { label: "June 2026", value: "2026-06" },
    { label: "May 2026", value: "2026-05" },
    { label: "April 2026", value: "2026-04" },
    { label: "March 2026", value: "2026-03" },
    { label: "February 2026", value: "2026-02" },
    { label: "January 2026", value: "2026-01" },
  ];

  const fetchBackupPreview = async (monthToFetch: string) => {
    try {
      setLoadingPreview(true);
      const res = await fetch(`/api/backup/email?month=${monthToFetch}`);
      const data = await res.json();
      if (data.success) {
        setPreviewData(data);
      }
    } catch (err) {
      console.error("Failed to load backup preview:", err);
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    fetchBackupPreview(selectedMonth);
  }, [selectedMonth]);

  const handleSendBackupEmail = async () => {
    try {
      setSendingEmail(true);
      setFeedback(null);

      const res = await fetch("/api/backup/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: selectedMonth === "all" ? undefined : selectedMonth,
          recipientEmail: recipientEmail.trim() || "owii.rajput@gmail.com",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: "success",
          message: data.message || `Monthly backup successfully emailed to ${recipientEmail}!`,
        });
      } else {
        setFeedback({
          type: "error",
          message: data.message || "Failed to send backup email.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: "Error sending backup email: " + (err.message || "Unknown error"),
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDownloadCsv = (categoryKey: string) => {
    const url = `/api/backup/download?month=${selectedMonth}&type=${encodeURIComponent(categoryKey)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* HEADER CARD */}
      <div className="bg-[#12121a] p-6 rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/20">
                <FileSpreadsheet size={18} />
              </span>
              <h2 className="text-xl font-black text-white">Monthly CSV Data Backup &amp; Email Dispatcher</h2>
            </div>
            <p className="text-xs text-gray-400 max-w-2xl">
              Export and dispatch separate CSV spreadsheets for <strong>Sales Transactions, Staff Attendance, Expenses, Online Bookings, Daily Closings, and Customer Master</strong> directly to your email.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchBackupPreview(selectedMonth)}
              disabled={loadingPreview}
              className="p-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition border border-white/10 cursor-pointer"
              title="Refresh Preview"
            >
              <RefreshCw size={16} className={loadingPreview ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-sm animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
              : "bg-red-950/40 border-red-500/30 text-red-300"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle size={20} className="shrink-0 text-emerald-400" /> : <AlertTriangle size={20} className="shrink-0 text-red-400" />}
          <div className="font-medium">{feedback.message}</div>
        </div>
      )}

      {/* CONTROLS BAR */}
      <div className="bg-[#12121a] p-6 rounded-3xl border border-white/5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-2">
              <Calendar size={14} className="text-red-400" /> Select Month for Backup
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition"
            >
              {monthsList.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-2">
              <Mail size={14} className="text-red-400" /> Destination Email Address
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="owii.rajput@gmail.com"
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSendBackupEmail}
              disabled={sendingEmail || !recipientEmail.trim()}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-950/50 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {sendingEmail ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
              {sendingEmail ? "Generating & Sending..." : "📩 Email Backup Package Now"}
            </button>
          </div>
        </div>
      </div>

      {/* SUMMARY STATS & ATTACHMENTS LIST */}
      {previewData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FINANCIAL SUMMARY CARD */}
          <div className="bg-[#12121a] p-6 rounded-3xl border border-white/5 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={14} className="text-emerald-400" /> Summary Metrics ({previewData.monthLabel})
                </h3>
              </div>

              <div className="space-y-3 pt-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-gray-400">Total Sales Revenue:</span>
                  <span className="text-emerald-400 font-bold">
                    ₹{previewData.summary.totalSales.toLocaleString("en-IN")} ({previewData.summary.salesCount} txns)
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-gray-400">Total Expenses:</span>
                  <span className="text-red-400 font-bold">
                    ₹{previewData.summary.totalExpenses.toLocaleString("en-IN")} ({previewData.summary.expensesCount} bills)
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-gray-400">Estimated Net Profit:</span>
                  <span
                    className={`font-black text-sm ${
                      previewData.summary.netProfit >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    ₹{previewData.summary.netProfit.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-gray-400">Bookings Logged:</span>
                  <span className="text-white font-medium">
                    {previewData.summary.bookingsCount} (₹{previewData.summary.totalBookingsCost.toLocaleString("en-IN")})
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-400">Attendance Records:</span>
                  <span className="text-white font-medium">{previewData.summary.attendanceCount} check-ins</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-2xl text-[11px] text-red-300/80 leading-relaxed mt-4">
              💡 All {previewData.files?.length || 7} files are generated as clean CSV datasets formatted with UTF-8 encoding.
            </div>
          </div>

          {/* ATTACHMENTS & DOWNLOAD CARDS */}
          <div className="lg:col-span-2 bg-[#12121a] p-6 rounded-3xl border border-white/5 space-y-4">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Layers size={14} className="text-red-400" /> Separate CSV Files in Backup Package
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {previewData.files?.map((file: any) => (
                <div
                  key={file.filename}
                  className="p-4 bg-black/40 hover:bg-black/60 rounded-2xl border border-white/5 transition flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-white group-hover:text-red-400 transition flex items-center gap-1.5">
                      <FileSpreadsheet size={14} className="text-emerald-400" />
                      <span>{file.category}</span>
                    </div>
                    <div className="text-[11px] font-mono text-gray-400 truncate max-w-[200px]">
                      {file.filename}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-semibold">
                      {file.recordCount} rows ready
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadCsv(file.category)}
                    className="p-2.5 bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white rounded-xl transition border border-white/10 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                    title={`Download ${file.filename}`}
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">CSV</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
