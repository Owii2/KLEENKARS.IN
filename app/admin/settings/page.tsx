"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface SystemSetting {
  key: string;
  value: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Individual Form States mapping to db settings keys
  const [storeTimings, setStoreTimings] = useState("9:00 AM - 8:00 PM");
  const [gstPercentage, setGstPercentage] = useState("18");
  const [chatbotRules, setChatbotRules] = useState("Always welcome customers and guide them to wash bookings.");
  const [discountCap, setDiscountCap] = useState("500");
  const [supportPhone, setSupportPhone] = useState("+91 99999 88888");
  const [companyAddress, setCompanyAddress] = useState("KleenKars HQ, Sector 3, Delhi, India");

  // Auto Detection Rules States
  const [autoDetectionRules, setAutoDetectionRules] = useState<any[]>([]);
  const [newRuleService, setNewRuleService] = useState("");
  const [newRuleVehicle, setNewRuleVehicle] = useState("");
  const [newRuleMinAmount, setNewRuleMinAmount] = useState("");
  const [newRuleMaxAmount, setNewRuleMaxAmount] = useState("");

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.success && data.settings) {
        const list: SystemSetting[] = data.settings;
        setSettings(list);

        // Find keys and populate state
        const timings = list.find((s) => s.key === "store_timings")?.value;
        if (timings) setStoreTimings(timings);

        const gst = list.find((s) => s.key === "gst_percentage")?.value;
        if (gst) setGstPercentage(gst);

        const rules = list.find((s) => s.key === "default_chatbot_rules")?.value;
        if (rules) setChatbotRules(rules);

        const cap = list.find((s) => s.key === "default_discount_cap")?.value;
        if (cap) setDiscountCap(cap);

        const phone = list.find((s) => s.key === "support_phone")?.value;
        if (phone) setSupportPhone(phone);

        const addr = list.find((s) => s.key === "company_address")?.value;
        if (addr) setCompanyAddress(addr);

        const detectionRulesStr = list.find((s) => s.key === "auto_detection_rules")?.value;
        if (detectionRulesStr) {
          try {
            setAutoDetectionRules(JSON.parse(detectionRulesStr));
          } catch (e) {
            console.error("Failed to parse auto detection rules", e);
          }
        } else {
          // Default fallback
          setAutoDetectionRules([
            { serviceOpted: "Bike Wash", vehicleType: "Bike", minAmount: 30, maxAmount: 50 },
            { serviceOpted: "Water Wash", vehicleType: "All", minAmount: 70, maxAmount: 100 },
            { serviceOpted: "Express Wash", vehicleType: "All", minAmount: 120, maxAmount: 150 },
            { serviceOpted: "Classic Wash", vehicleType: "Hatchback/Sedan", minAmount: 160, maxAmount: 200 },
            { serviceOpted: "Classic Wash", vehicleType: "SUV", minAmount: 220, maxAmount: 250 },
            { serviceOpted: "Premium Wash", vehicleType: "Hatchback", minAmount: 260, maxAmount: 300 },
            { serviceOpted: "Premium Wash", vehicleType: "Sedan", minAmount: 320, maxAmount: 350 },
            { serviceOpted: "Premium Wash", vehicleType: "SUV", minAmount: 360, maxAmount: 400 },
            { serviceOpted: "Premium + Wax", vehicleType: "Sedan", minAmount: 449, maxAmount: 450 },
            { serviceOpted: "Premium + Wax", vehicleType: "SUV", minAmount: 499, maxAmount: 500 },
            { serviceOpted: "Interior Dry Clean", vehicleType: "Hatchback/Sedan", minAmount: 799, maxAmount: 1000 },
            { serviceOpted: "Interior Dry Clean", vehicleType: "SUV", minAmount: 1001, maxAmount: 1200 },
            { serviceOpted: "Paint Correction", vehicleType: "Hatchback/Sedan", minAmount: 1499, maxAmount: 1499 },
            { serviceOpted: "Paint Correction", vehicleType: "SUV", minAmount: 1799, maxAmount: 1799 },
            { serviceOpted: "Dealer Monthly", vehicleType: "Bulk", minAmount: 2000, maxAmount: 999999 }
          ]);
        }
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const addLocalRule = () => {
    if (!newRuleService || !newRuleVehicle || !newRuleMinAmount || !newRuleMaxAmount) {
      alert("Please fill in all auto detection rule fields.");
      return;
    }
    const min = parseInt(newRuleMinAmount, 10);
    const max = parseInt(newRuleMaxAmount, 10);
    if (isNaN(min) || isNaN(max)) {
      alert("Amounts must be valid integers.");
      return;
    }
    const newRule = {
      serviceOpted: newRuleService.trim(),
      vehicleType: newRuleVehicle.trim(),
      minAmount: min,
      maxAmount: max,
    };
    setAutoDetectionRules((prev) => [...prev, newRule]);
    // Reset inputs
    setNewRuleService("");
    setNewRuleVehicle("");
    setNewRuleMinAmount("");
    setNewRuleMaxAmount("");
  };

  const removeLocalRule = (index: number) => {
    setAutoDetectionRules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      const itemsToSave = [
        { key: "store_timings", value: storeTimings },
        { key: "gst_percentage", value: gstPercentage },
        { key: "default_chatbot_rules", value: chatbotRules },
        { key: "default_discount_cap", value: discountCap },
        { key: "support_phone", value: supportPhone },
        { key: "company_address", value: companyAddress },
        { key: "auto_detection_rules", value: JSON.stringify(autoDetectionRules) },
      ];

      // Save each setting sequentially or concurrently
      const promises = itemsToSave.map((item) =>
        fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        }).then((res) => res.json())
      );

      const results = await Promise.all(promises);
      const allSuccess = results.every((r) => r.success);

      if (allSuccess) {
        alert("All system settings and auto detection rules updated successfully!");
        fetchSettings();
      } else {
        alert("Some settings failed to save.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="System Configurations Panel">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-red-500">
          Console Settings
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Modify store operational guidelines, default tax metrics, bot instructions, and financial policies.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-500">
          Loading system configurations...
        </div>
      ) : (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl">
          {/* Card: Operational Settings */}
          <div className="bg-[#0b0b0b] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-850 pb-3">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Operational Configurations
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                  Store Working Hours
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9:00 AM - 8:00 PM"
                  value={storeTimings}
                  onChange={(e) => setStoreTimings(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                  GST Rate (%)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 18"
                  value={gstPercentage}
                  onChange={(e) => setGstPercentage(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 font-mono text-sm transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                  Support Telephone
                </label>
                <input
                  type="text"
                  placeholder="e.g. +91 99999 88888"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 font-mono text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                  Discount Cap Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={discountCap}
                  onChange={(e) => setDiscountCap(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 font-mono text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                Store HQ Address
              </label>
              <input
                type="text"
                placeholder="HQ Address Details"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 text-sm transition"
              />
            </div>
          </div>

          {/* Card: Chatbot rules */}
          <div className="bg-[#0b0b0b] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-850 pb-3">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              AI Assistant Guidelines
            </h2>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                Chatbot Persona Directives
              </label>
              <textarea
                placeholder="Define rules, greeting style, promotional push targets for the assistant bot..."
                value={chatbotRules}
                onChange={(e) => setChatbotRules(e.target.value)}
                rows={5}
                className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-red-600 text-sm transition"
              />
              <p className="text-[10px] text-gray-500 mt-1.5">
                These prompts are prepended as system instructions during customer live chatbot interactions.
              </p>
            </div>
          </div>

          {/* Card: Auto Detection Rules */}
          <div className="bg-[#0b0b0b] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-850 pb-3">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Transaction Auto‑Detection Rules
            </h2>

            <p className="text-xs text-gray-400">
              Transactions without a service name or vehicle type (e.g. from bulk sheet imports or simple entries) are matched automatically against these rules based on the total payment amount.
            </p>

            {/* List Table */}
            <div className="max-h-80 overflow-y-auto border border-gray-900 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-black border-b border-gray-950 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Service Opted</th>
                    <th className="py-2.5 px-3">Vehicle Type</th>
                    <th className="py-2.5 px-3">Min Amount</th>
                    <th className="py-2.5 px-3">Max Amount</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900 bg-black/45">
                  {autoDetectionRules.map((rule, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-2 px-3 text-gray-200">{rule.serviceOpted}</td>
                      <td className="py-2 px-3 text-gray-200">{rule.vehicleType}</td>
                      <td className="py-2 px-3 text-emerald-400 font-mono">₹{rule.minAmount}</td>
                      <td className="py-2 px-3 text-emerald-400 font-mono">₹{rule.maxAmount}</td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeLocalRule(idx)}
                          className="text-red-500 hover:text-red-400 font-bold hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add New Rule Inline Form */}
            <div className="bg-black/30 border border-gray-900 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wide">Add Auto Detection Rule</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <input
                    type="text"
                    placeholder="Service Name (e.g. Wash)"
                    value={newRuleService}
                    onChange={(e) => setNewRuleService(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-red-600 text-xs transition"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Vehicle (e.g. SUV, All)"
                    value={newRuleVehicle}
                    onChange={(e) => setNewRuleVehicle(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-red-600 text-xs transition"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Min Amount"
                    value={newRuleMinAmount}
                    onChange={(e) => setNewRuleMinAmount(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-red-600 text-xs font-mono transition"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Max Amount"
                    value={newRuleMaxAmount}
                    onChange={(e) => setNewRuleMaxAmount(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-red-600 text-xs font-mono transition"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={addLocalRule}
                  className="bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 font-bold px-4 py-1.5 rounded-lg text-xs transition"
                >
                  + Add Rule to List
                </button>
              </div>
            </div>
          </div>

          {/* Submit block */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] transition-all text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-red-900/30 flex items-center gap-2 text-sm"
            >
              {saving ? (
                <span>Upserting Settings...</span>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Save Configurations
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </DashboardLayout>
  );
}
