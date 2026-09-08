"use client";

import React, { useState } from "react";
import {
  Upload,
  Zap,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  ShieldCheck,
  User,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
} from "lucide-react";

interface BharatPeReconcilerProps {
  onReconciliationComplete?: () => void;
}

export default function BharatPeReconciler({ onReconciliationComplete }: BharatPeReconcilerProps) {
  const [csvContent, setCsvContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [importUnmatched, setImportUnmatched] = useState<boolean>(false);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [committing, setCommitting] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setCsvContent(text);
      runPreview(text);
    };
    reader.readAsText(file);
  };

  const runPreview = async (rawCsv: string) => {
    if (!rawCsv.trim()) {
      setFeedback({ type: "error", message: "Please select or paste a BharatPe CSV statement first." });
      return;
    }

    try {
      setLoadingPreview(true);
      setFeedback(null);

      const res = await fetch("/api/transactions/bharatpe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvContent: rawCsv,
          action: "preview",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPreviewData(data);
      } else {
        setFeedback({ type: "error", message: data.message || "Failed to analyze CSV." });
        setPreviewData(null);
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: "Network error: " + err.message });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleCommit = async () => {
    if (!csvContent.trim()) return;

    try {
      setCommitting(true);
      setFeedback(null);

      const res = await fetch("/api/transactions/bharatpe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvContent,
          action: "commit",
          importUnmatched,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: "success", message: data.message });
        setPreviewData(null);
        setCsvContent("");
        setFileName("");
        if (onReconciliationComplete) {
          onReconciliationComplete();
        }
      } else {
        setFeedback({ type: "error", message: data.message || "Failed to reconcile transactions." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: "Error committing reconciliation: " + err.message });
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* HEADER CARD */}
      <div className="bg-[#12121a] p-6 rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/20">
                <Zap size={18} />
              </span>
              <h2 className="text-xl font-black text-white">Smart BharatPe Statement Reconciler &amp; CRM Auto-Enrichment</h2>
            </div>
            <p className="text-xs text-gray-400 max-w-2xl">
              Upload your BharatPe statement to automatically attach customer names &amp; UTR IDs to your manual washes 
              by matching <strong>Date + Amount + UPI</strong>. Guaranteed <strong>0 duplicate transactions</strong> with built-in UTR locks.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-semibold shrink-0">
            <ShieldCheck size={16} /> 100% Duplicate-Proof
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

      {/* UPLOAD & CONTROLS */}
      <div className="bg-[#12121a] p-6 rounded-3xl border border-white/5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* File Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-2">
              <FileSpreadsheet size={14} className="text-purple-400" /> Upload BharatPe CSV Statement
            </label>
            <div className="relative border-2 border-dashed border-white/10 hover:border-purple-500/50 rounded-2xl p-4 text-center transition bg-[#0a0a0f] cursor-pointer">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload size={24} className="mx-auto text-gray-400 mb-2" />
              <p className="text-xs font-semibold text-white">
                {fileName ? `📄 ${fileName}` : "Click or drag & drop BharatPe statement CSV"}
              </p>
              <p className="text-[10px] text-gray-500 mt-1">Supports all standard BharatPe / UPI exports</p>
            </div>
          </div>

          {/* Paste or Text Box */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-300 flex items-center gap-2">
                <FileSpreadsheet size={14} className="text-purple-400" /> Or Paste CSV Raw Text
              </label>
              {csvContent && (
                <button
                  onClick={() => runPreview(csvContent)}
                  disabled={loadingPreview}
                  className="text-[11px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={12} className={loadingPreview ? "animate-spin" : ""} /> Refresh Analysis
                </button>
              )}
            </div>
            <textarea
              rows={4}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="Paste raw CSV text here (Date, Amount, Payer Name, UTR)..."
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-2xl p-3 text-xs font-mono text-gray-300 focus:outline-none focus:border-purple-500 transition"
            />
          </div>
        </div>

        {/* Options Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-white/5">
          <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={importUnmatched}
              onChange={(e) => setImportUnmatched(e.target.checked)}
              className="rounded bg-black border-white/20 text-purple-600 focus:ring-0 w-4 h-4 cursor-pointer"
            />
            <span>Also import unrecorded UPI payments as new transactions (if any wash was not logged manually)</span>
          </label>

          {previewData && (
            <button
              onClick={handleCommit}
              disabled={committing || previewData.summary.matchedCount === 0 && !importUnmatched}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-950/40 transition flex items-center gap-2 cursor-pointer shrink-0"
            >
              {committing ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              <span>{committing ? "Reconciling..." : `⚡ Enrich ${previewData.summary.matchedCount} Washes with Customer Names`}</span>
            </button>
          )}
        </div>
      </div>

      {/* PREVIEW RESULTS */}
      {previewData && (
        <div className="space-y-6">
          {/* STATS TILES */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#12121a] p-4 rounded-2xl border border-white/5">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Rows in File</span>
              <p className="text-2xl font-black text-white mt-1">{previewData.summary.totalRows}</p>
            </div>
            <div className="bg-emerald-950/20 p-4 rounded-2xl border border-emerald-500/20">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle size={14} /> Ready to Enrich
              </span>
              <p className="text-2xl font-black text-emerald-300 mt-1">{previewData.summary.matchedCount} Washes</p>
              <span className="text-[10px] text-emerald-400/80">Names attached to manual records</span>
            </div>
            <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck size={14} className="text-blue-400" /> Already Synced
              </span>
              <p className="text-2xl font-black text-gray-300 mt-1">{previewData.summary.alreadySyncedCount} Rows</p>
              <span className="text-[10px] text-gray-500">Skipped (0 duplicates)</span>
            </div>
            <div className="bg-purple-950/20 p-4 rounded-2xl border border-purple-500/20">
              <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">Unmatched Payments</span>
              <p className="text-2xl font-black text-purple-300 mt-1">{previewData.summary.unmatchedCount}</p>
              <span className="text-[10px] text-purple-400/80">{importUnmatched ? "Will be created" : "Ignored unless opted-in"}</span>
            </div>
          </div>

          {/* MATCHED TABLE */}
          {previewData.matchedItems?.length > 0 && (
            <div className="bg-[#12121a] p-6 rounded-3xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-400" />
                  Matched Transactions Ready for Auto-Enrichment ({previewData.summary.matchedCount})
                </h3>
                <span className="text-xs text-gray-400">Showing first {previewData.matchedItems.length} items</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#181822] text-gray-400 font-bold border-b border-white/5">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Manual Record</th>
                      <th className="p-3">BharatPe Customer Name</th>
                      <th className="p-3">Bank UTR ID</th>
                      <th className="p-3 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    {previewData.matchedItems.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition">
                        <td className="p-3 font-mono text-gray-400">{item.date}</td>
                        <td className="p-3 font-bold text-emerald-400">₹{item.amount.toLocaleString("en-IN")}</td>
                        <td className="p-3">
                          <span className="text-white font-semibold">{item.serviceOpted}</span>
                          <span className="text-[11px] text-gray-500 block font-mono">{item.invoiceId}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                            <User size={13} className="text-purple-400" />
                            <span>{item.newPayerName}</span>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-gray-400 truncate max-w-[160px]">
                          {item.utr || "N/A"}
                        </td>
                        <td className="p-3 text-right">
                          <span className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-lg text-[10px] font-semibold">
                            Enrich Name (0 Dups)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ALREADY SYNCED LIST */}
          {previewData.alreadySyncedItems?.length > 0 && (
            <div className="bg-[#12121a] p-5 rounded-3xl border border-white/5 space-y-3">
              <h4 className="text-xs font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wider">
                <ShieldCheck size={14} className="text-blue-400" /> Already Processed &amp; Safely Skipped ({previewData.summary.alreadySyncedCount})
              </h4>
              <p className="text-xs text-gray-500">
                These payments have already been reconciled in past uploads and are protected from duplication.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
