"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface Payroll {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  month: string;
  workingDays: number;
  dailyWage: number;
  advances: number;
  deductions: number;
  netPayable: number;
  status: string;
  paidAt?: string | null;
}

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetMonth, setTargetMonth] = useState("");
  const [processing, setProcessing] = useState(false);

  // Manual payroll log states
  const [showAddForm, setShowAddForm] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [manualMonth, setManualMonth] = useState("");
  const [manualDays, setManualDays] = useState("");
  const [manualWage, setManualWage] = useState("");
  const [manualAdvances, setManualAdvances] = useState("");
  const [manualDeductions, setManualDeductions] = useState("");

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/payroll");
      const data = await res.json();
      setPayrolls(data.payrolls || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPayroll();
    fetchEmployees();
    const now = new Date();
    setTargetMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    setManualMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  }, []);

  const handleAutoProcess = async () => {
    if (!targetMonth) {
      alert("Please select a month first.");
      return;
    }

    try {
      setProcessing(true);
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoProcess: true, month: targetMonth }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Successfully processed payroll for month: ${targetMonth}!`);
        fetchPayroll();
      } else {
        alert(data.message || "Failed to process payroll.");
      }
    } catch (err) {
      console.error(err);
      alert("Error processing payroll.");
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Paid" ? "Unpaid" : "Paid";
    try {
      const res = await fetch(`/api/payroll/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchPayroll();
      } else {
        alert(data.message || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payroll record?")) return;

    try {
      const res = await fetch(`/api/payroll/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchPayroll();
      } else {
        alert(data.message || "Failed to delete record");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualSubmit = async () => {
    if (!selectedEmpId || !manualDays || !manualWage || !manualMonth) {
      alert("Please fill all required fields.");
      return;
    }

    const emp = employees.find((e) => e.id === selectedEmpId);
    if (!emp) return;

    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: emp.id,
          employeeName: emp.name,
          employeeCode: emp.employeeCode,
          month: manualMonth,
          workingDays: Number(manualDays),
          dailyWage: Number(manualWage),
          advances: Number(manualAdvances || 0),
          deductions: Number(manualDeductions || 0),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("Payroll entry added successfully!");
        setShowAddForm(false);
        // reset fields
        setSelectedEmpId("");
        setManualDays("");
        setManualWage("");
        setManualAdvances("");
        setManualDeductions("");
        fetchPayroll();
      } else {
        alert(data.message || "Failed to add manual entry.");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding payroll entry.");
    }
  };

  return (
    <DashboardLayout title="Operational Payroll Dashboard">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-red-500">
            Payroll Ledger
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Calculate employee pay rates, track salary advances, log work-days, and process payouts.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-white/5 hover:bg-white/10 text-white font-semibold px-4 py-2.5 rounded-lg border border-white/10 transition active:scale-95"
          >
            Add Manual Entry
          </button>
          <div className="flex items-center gap-2 bg-[#111] border border-gray-800 rounded-lg p-1">
            <input
              type="month"
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
              className="bg-transparent border-0 text-sm text-white px-2 focus:outline-none"
            />
            <button
              onClick={handleAutoProcess}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white font-semibold text-sm px-4 py-2 rounded-md transition active:scale-95"
            >
              {processing ? "Processing..." : "Process Month"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Registry */}
      <div className="bg-[#0b0b0b] rounded-xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-500">
            Fetching payroll records...
          </div>
        ) : payrolls.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-sm">
            No payroll records found. Select a month and click "Process Month" to generate automatically.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#141414] text-gray-400 font-semibold uppercase tracking-wider text-xs border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Month</th>
                  <th className="px-6 py-4">Days Worked</th>
                  <th className="px-6 py-4">Rate/Day</th>
                  <th className="px-6 py-4">Advances (-)</th>
                  <th className="px-6 py-4">Deductions (-)</th>
                  <th className="px-6 py-4">Net Payable</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-850">
                {payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-[#121212]/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{p.employeeName}</div>
                      <div className="text-gray-500 text-xs font-mono">{p.employeeCode}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 font-mono">
                      {p.month}
                    </td>
                    <td className="px-6 py-4 text-white font-medium">
                      {p.workingDays} days
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      ₹{p.dailyWage}
                    </td>
                    <td className="px-6 py-4 text-red-400 font-mono">
                      ₹{p.advances}
                    </td>
                    <td className="px-6 py-4 text-red-400 font-mono">
                      ₹{p.deductions}
                    </td>
                    <td className="px-6 py-4 text-green-400 font-bold font-mono">
                      ₹{p.netPayable}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(p.id, p.status)}
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border transition hover:opacity-80 active:scale-95 ${
                          p.status === "Paid"
                            ? "bg-green-950/40 text-green-400 border-green-800/40"
                            : "bg-yellow-950/40 text-yellow-400 border-yellow-800/40"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${p.status === "Paid" ? "bg-green-400" : "bg-yellow-400"}`} />
                        {p.status}
                      </button>
                      {p.paidAt && (
                        <div className="text-[10px] text-gray-500 mt-1">
                          Paid on {new Date(p.paidAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-red-500 hover:text-red-400 font-semibold text-xs ml-3 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md transition"
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

      {/* Manual Entry Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-gray-900 border border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl glass-panel relative text-left">
            <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
              Manual Payroll Entry
            </h3>
            <p className="text-xs text-gray-400 mb-4">Add a manual salary transaction or advance entry to the ledger.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Select Employee *</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => {
                    setSelectedEmpId(e.target.value);
                    const emp = employees.find((x) => x.id === e.target.value);
                    if (emp) setManualWage(emp.salaryPerDay);
                  }}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 transition"
                >
                  <option value="">-- Choose Staff member --</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.employeeCode} - {e.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Month *</label>
                  <input
                    type="month"
                    value={manualMonth}
                    onChange={(e) => setManualMonth(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Days Worked *</label>
                  <input
                    type="number"
                    value={manualDays}
                    onChange={(e) => setManualDays(e.target.value)}
                    placeholder="e.g. 26"
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Rate/Day *</label>
                  <input
                    type="number"
                    value={manualWage}
                    onChange={(e) => setManualWage(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Advances</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={manualAdvances}
                    onChange={(e) => setManualAdvances(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Deductions</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={manualDeductions}
                    onChange={(e) => setManualDeductions(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 transition"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 border-t border-white/5 pt-4">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl font-bold transition active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleManualSubmit}
                className="flex-1 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white py-3 rounded-xl font-bold transition active:scale-95 shadow-lg"
              >
                Log Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
