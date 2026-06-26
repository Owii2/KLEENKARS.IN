"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Card from "@/components/ui/Card";

interface ApprovalRequest {
  id: string;
  entityType: string;
  entityId: string | null;
  action: string;
  managerId: string;
  managerName: string | null;
  previousData: string | null;
  newData: string | null;
  status: string;
  createdAt: string;
  expiresAt: string;
}

interface ApprovalsResponse {
  success: boolean;
  approvals?: ApprovalRequest[];
  autoApprovalDays?: number;
}

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [autoApprovalDays, setAutoApprovalDays] = useState<number>(3);
  const [loading, setLoading] = useState(true);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/approvals");
      const data = await res.json() as ApprovalsResponse;
      if (data.success) {
        setRequests(data.approvals || []);
        if (data.autoApprovalDays !== undefined) {
          setAutoApprovalDays(data.autoApprovalDays);
        }
      }
    } catch (err) {
      console.error("Error loading approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setUpdatingSettings(true);
      const res = await fetch("/api/admin/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoApprovalDays }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Auto-approval window settings updated successfully!");
        fetchApprovals();
      } else {
        alert(data.message || "Failed to update settings");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving settings");
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleAction = async (id: string, actionType: "APPROVE" | "REJECT") => {
    try {
      setProcessingId(id);
      const res = await fetch(`/api/admin/approvals/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || `${actionType === "APPROVE" ? "Approved" : "Rejected"} successfully!`);
        fetchApprovals();
      } else {
        alert(data.message || "Failed to process request");
      }
    } catch (err) {
      console.error(err);
      alert("Error processing action");
    } finally {
      setProcessingId(null);
    }
  };

  const renderDiff = (approval: ApprovalRequest) => {
    try {
      const prev = approval.previousData ? JSON.parse(approval.previousData) : null;
      const next = approval.newData ? JSON.parse(approval.newData) : null;

      // Extract unique keys from both previous and new data snapshots
      const allKeys = Array.from(
        new Set([...Object.keys(prev || {}), ...Object.keys(next || {})])
      ).filter((k) => k !== "id" && k !== "createdAt" && k !== "updatedAt");

      if (allKeys.length === 0) {
        return <p className="text-gray-600 text-xs italic">No snapshot details available.</p>;
      }

      return (
        <div className="bg-black/50 border border-gray-850 rounded-xl p-4 mt-4 space-y-2">
          <div className="grid grid-cols-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-850 pb-2 mb-1">
            <span>Parameter</span>
            <span>Original State</span>
            <span>Proposed State</span>
          </div>
          {allKeys.map((key) => {
            const prevVal = prev ? prev[key] : undefined;
            const nextVal = next ? next[key] : undefined;

            const formatVal = (val: any) => {
              if (val === null || val === undefined) return "-";
              if (Array.isArray(val)) return val.join(", ") || "[]";
              if (typeof val === "boolean") return val ? "Yes" : "No";
              return String(val);
            };

            const prevStr = formatVal(prevVal);
            const nextStr = formatVal(nextVal);
            const isChanged = prevStr !== nextStr;

            return (
              <div
                key={key}
                className={`grid grid-cols-3 text-xs py-1 transition-colors ${
                  isChanged ? "bg-red-500/5 text-yellow-500 font-medium" : "text-gray-400"
                }`}
              >
                <span className="font-mono text-gray-500">{key}</span>
                <span className="truncate pr-3">{prevStr}</span>
                <span className="truncate font-semibold">{nextStr}</span>
              </div>
            );
          })}
        </div>
      );
    } catch {
      return <p className="text-red-400 text-xs">Failed to compile change analysis preview.</p>;
    }
  };

  return (
    <DashboardLayout title="Approvals & Reversions Center">
      {/* Settings section */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-white mb-2">Audit Control & Approvals Dashboard</h2>
          <p className="text-xs text-gray-400">
            Review overrides submitted by managers. Approved actions commit to the DB, while rejections trigger automatic state rollbacks.
          </p>
        </div>

        <Card className="bg-[#111]/30 p-4 border-gray-800 flex flex-col justify-between">
          <div>
            <label className="text-gray-400 text-xs font-semibold block uppercase tracking-wider">
              Auto-Approval Threshold
            </label>
            <div className="flex gap-2 mt-2">
              <input
                type="number"
                min="1"
                max="30"
                value={autoApprovalDays}
                onChange={(e) => setAutoApprovalDays(Number(e.target.value) || 3)}
                className="bg-black border border-gray-800 focus:border-red-600 outline-none text-white text-sm px-3 py-2 rounded-lg font-mono w-24"
              />
              <span className="text-gray-400 text-sm self-center">days</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">
              Override requests expire and auto-resolve after this period.
            </p>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={updatingSettings}
            className="mt-4 bg-red-650 hover:bg-red-600 text-white text-xs font-semibold py-2 px-4 rounded-lg self-end transition"
          >
            {updatingSettings ? "Saving..." : "Update Setting"}
          </button>
        </Card>
      </div>

      {/* Main content list */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-20 text-center text-gray-500">
            <svg className="animate-spin h-8 w-8 mx-auto text-red-600 mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Fetching approval logs...
          </div>
        ) : requests.length === 0 ? (
          <Card className="text-center py-16 text-gray-500 text-sm">
            All override requests have been resolved. No pending actions.
          </Card>
        ) : (
          requests.map((req) => (
            <Card key={req.id} className="hover:border-gray-800 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Details */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-zinc-800 border border-zinc-700 text-white text-xs font-mono px-2 py-0.5 rounded font-bold">
                      {req.entityType.toUpperCase()}
                    </span>
                    <span className="text-gray-500 text-xs font-semibold">•</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        req.action === "CREATE"
                          ? "bg-green-950 text-green-400 border border-green-800/40"
                          : req.action === "DELETE"
                          ? "bg-red-950 text-red-400 border border-red-800/40"
                          : "bg-blue-950 text-blue-400 border border-blue-800/40"
                      }`}
                    >
                      {req.action}
                    </span>
                    <span className="text-gray-500 text-xs font-semibold">•</span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                        req.status === "APPROVED"
                          ? "bg-green-950/40 text-green-400 border-green-800/40"
                          : req.status === "REJECTED"
                          ? "bg-red-950/40 text-red-400 border-red-800/40"
                          : "bg-yellow-950/40 text-yellow-400 border-yellow-800/40"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white pt-1">
                    Requested by Manager: <span className="text-red-400">{req.managerName || "Staff User"}</span>
                  </h3>
                  <div className="text-xs text-gray-500 font-mono">
                    Requested: {new Date(req.createdAt).toLocaleString()} • Expires: {new Date(req.expiresAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Approve/Reject Controls */}
                {req.status === "PENDING" && (
                  <div className="flex gap-2 items-center self-start md:self-center">
                    <button
                      onClick={() => handleAction(req.id, "REJECT")}
                      disabled={processingId !== null}
                      className="bg-transparent hover:bg-red-600/10 border border-red-900/50 hover:border-red-600 transition text-red-400 font-semibold px-4 py-2 rounded-lg text-xs"
                    >
                      Reject & Revert
                    </button>
                    <button
                      onClick={() => handleAction(req.id, "APPROVE")}
                      disabled={processingId !== null}
                      className="bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all text-white font-semibold px-4 py-2 rounded-lg text-xs shadow-md"
                    >
                      Approve Override
                    </button>
                  </div>
                )}
              </div>

              {/* Collapsible/Rendered Change Diff analysis */}
              {renderDiff(req)}
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
