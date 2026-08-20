"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  Sliders,
  Database,
  ExternalLink,
} from "lucide-react";

interface ExpenseGoogleSheetSyncProps {
  onSyncComplete?: () => void;
}

export default function ExpenseGoogleSheetSync({ onSyncComplete }: ExpenseGoogleSheetSyncProps) {
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>(
    "https://docs.google.com/spreadsheets/d/1G1vI5n7QifWB778D5d37wrRZqlZjcLUlxtCb9gUtPWc/edit?usp=sharing"
  );
  const [sheetName, setSheetName] = useState<string>("Expenses");
  const [startRow, setStartRow] = useState<number>(2);

  // Column overrides
  const [showAdvancedMapping, setShowAdvancedMapping] = useState(false);
  const [customDate, setCustomDate] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customPaidTo, setCustomPaidTo] = useState("");
  const [customPaymentMode, setCustomPaymentMode] = useState("");
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState("");
  const [customNotes, setCustomNotes] = useState("");

  // States
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleFetchPreview = async () => {
    if (!googleSheetUrl.trim()) {
      setFeedback({ type: "error", message: "Please enter a valid Google Sheet URL." });
      return;
    }

    try {
      setLoadingPreview(true);
      setFeedback(null);

      const params = new URLSearchParams({
        url: googleSheetUrl.trim(),
        sheet: sheetName.trim(),
      });

      const res = await fetch(`/api/expenses/google-sheet?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setPreviewData(data);
        setFeedback({
          type: "success",
          message: `Successfully connected! Detected ${data.totalRows} data rows in sheet '${sheetName || "Default"}'.`,
        });
      } else {
        setFeedback({
          type: "error",
          message: data.message || "Failed to preview Google Sheet.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: "Network error fetching Google Sheet: " + err.message,
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleStartSync = async () => {
    if (!googleSheetUrl.trim()) {
      setFeedback({ type: "error", message: "Please enter a valid Google Sheet URL." });
      return;
    }

    try {
      setSyncing(true);
      setFeedback(null);

      const payload = {
        googleSheetUrl: googleSheetUrl.trim(),
        sheetName: sheetName.trim(),
        startRow,
        customColumns: {
          date: customDate.trim() || undefined,
          amount: customAmount.trim() || undefined,
          category: customCategory.trim() || undefined,
          description: customDescription.trim() || undefined,
          paidTo: customPaidTo.trim() || undefined,
          paymentMode: customPaymentMode.trim() || undefined,
          invoiceNumber: customInvoiceNumber.trim() || undefined,
          notes: customNotes.trim() || undefined,
        },
      };

      const res = await fetch("/api/expenses/google-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setFeedback({
          type: "success",
          message: data.message || `Synchronized ${data.importedCount} expense records into database (ALL CAPS converted)!`,
        });
        if (onSyncComplete) onSyncComplete();
      } else {
        setFeedback({
          type: "error",
          message: data.message || "Failed to synchronize expenses from Google Sheet.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: "Error during auto-sync: " + err.message,
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* HEADER BANNER */}
      <div className="bg-[#12121a] p-6 rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/20">
                <FileSpreadsheet size={18} />
              </span>
              <h2 className="text-xl font-black text-white">Expense Google Sheet Auto-Sync</h2>
            </div>
            <p className="text-xs text-gray-400 max-w-2xl">
              Connect any Google Sheet to automatically sync your operational expenses. Converts all lowercase text to <strong>UPPERCASE (ALL CAPS)</strong> and deduplicates identical records automatically.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
              <Sparkles size={13} /> Auto-Uppercase Enabled
            </span>
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
          {feedback.type === "success" ? (
            <CheckCircle size={20} className="shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle size={20} className="shrink-0 text-red-400" />
          )}
          <div className="font-medium">{feedback.message}</div>
        </div>
      )}

      {/* CONFIGURATION CONTROLS */}
      <div className="bg-[#12121a] p-6 rounded-3xl border border-white/5 space-y-4">
        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
          <Database size={14} className="text-emerald-400" /> Sheet Source &amp; Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 space-y-1.5">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-2">
              Google Sheet URL / Link
            </label>
            <input
              type="text"
              value={googleSheetUrl}
              onChange={(e) => setGoogleSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition font-mono text-xs"
            />
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Sheet Tab Name</label>
            <input
              type="text"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              placeholder="Expenses / Sheet1"
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition font-mono text-xs"
            />
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Start Row Index</label>
            <input
              type="number"
              min={1}
              value={startRow}
              onChange={(e) => setStartRow(parseInt(e.target.value, 10) || 2)}
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition font-mono text-xs"
            />
          </div>
        </div>

        {/* TOGGLE ADVANCED COLUMN MAPPING */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowAdvancedMapping(!showAdvancedMapping)}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 cursor-pointer font-semibold transition"
          >
            <Sliders size={14} className="text-emerald-400" />
            <span>{showAdvancedMapping ? "Hide Custom Column Mapping" : "⚙️ Customize Column Mappings (Letters like A, B, C...)"}</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleFetchPreview}
              disabled={loadingPreview}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-200 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-white/10 cursor-pointer"
            >
              <RefreshCw size={14} className={loadingPreview ? "animate-spin" : ""} />
              {loadingPreview ? "Reading Sheet..." : "Preview Sheet Columns"}
            </button>

            <button
              onClick={handleStartSync}
              disabled={syncing}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer"
            >
              {syncing ? <RefreshCw size={14} className="animate-spin" /> : <Layers size={14} />}
              {syncing ? "Syncing (Converting to CAPS)..." : "⚡ Start Auto-Sync (ALL CAPS)"}
            </button>
          </div>
        </div>

        {/* ADVANCED COLUMN OVERRIDES */}
        {showAdvancedMapping && (
          <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-3 animate-in fade-in">
            <p className="text-[11px] text-gray-400">
              Specify custom column letters (e.g. <code>A</code>, <code>B</code>, <code>C</code>, <code>D</code>) or exact header titles if your sheet does not use standard names.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1 font-semibold">Date Column</label>
                <input
                  type="text"
                  placeholder="e.g. A"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full bg-[#12121a] border border-white/10 rounded-lg px-3 py-1.5 text-white uppercase font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1 font-semibold">Amount Column</label>
                <input
                  type="text"
                  placeholder="e.g. B"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full bg-[#12121a] border border-white/10 rounded-lg px-3 py-1.5 text-white uppercase font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1 font-semibold">Category Column</label>
                <input
                  type="text"
                  placeholder="e.g. C"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full bg-[#12121a] border border-white/10 rounded-lg px-3 py-1.5 text-white uppercase font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1 font-semibold">Title / Description</label>
                <input
                  type="text"
                  placeholder="e.g. D"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="w-full bg-[#12121a] border border-white/10 rounded-lg px-3 py-1.5 text-white uppercase font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1 font-semibold">Paid To / Vendor</label>
                <input
                  type="text"
                  placeholder="e.g. E"
                  value={customPaidTo}
                  onChange={(e) => setCustomPaidTo(e.target.value)}
                  className="w-full bg-[#12121a] border border-white/10 rounded-lg px-3 py-1.5 text-white uppercase font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1 font-semibold">Payment Mode</label>
                <input
                  type="text"
                  placeholder="e.g. F"
                  value={customPaymentMode}
                  onChange={(e) => setCustomPaymentMode(e.target.value)}
                  className="w-full bg-[#12121a] border border-white/10 rounded-lg px-3 py-1.5 text-white uppercase font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1 font-semibold">Invoice / Bill No</label>
                <input
                  type="text"
                  placeholder="e.g. G"
                  value={customInvoiceNumber}
                  onChange={(e) => setCustomInvoiceNumber(e.target.value)}
                  className="w-full bg-[#12121a] border border-white/10 rounded-lg px-3 py-1.5 text-white uppercase font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1 font-semibold">Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. H"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full bg-[#12121a] border border-white/10 rounded-lg px-3 py-1.5 text-white uppercase font-mono text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* LIVE PREVIEW TABLE WITH UPPERCASE TRANSFORMATION */}
      {previewData && (
        <div className="bg-[#12121a] p-6 rounded-3xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={14} className="text-emerald-400" />
              Live Preview with UPPERCASE Conversion (First 10 Rows)
            </h3>
            <span className="text-xs text-gray-400 font-mono">
              Headers: [{previewData.headers.join(", ")}]
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-white/10 text-gray-400">
                  <th className="py-2.5 px-3">Row</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Title / Description</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Paid To / Vendor</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3">Invoice No</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {previewData.preview.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-white/5 transition">
                    <td className="py-2.5 px-3 text-gray-500">#{row.rowNumber}</td>
                    <td className="py-2.5 px-3 text-gray-300">{row.date}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">{row.category || "OPERATIONAL"}</td>
                    <td className="py-2.5 px-3 text-white font-semibold">{row.description || "-"}</td>
                    <td className="py-2.5 px-3 text-red-400 font-bold">₹{row.amount}</td>
                    <td className="py-2.5 px-3 text-gray-300">{row.paidTo || "-"}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold text-white">
                        {row.paymentMode}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-400">{row.invoiceNumber || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
