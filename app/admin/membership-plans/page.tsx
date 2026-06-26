"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  benefits: string | null; // stored as stringified JSON or text list
  createdAt: string;
}

interface Customer {
  id: string;
  customerName: string;
  phoneNumber: string;
}

interface Membership {
  id: string;
  customerId: string;
  membershipPlanId: string;
  startDate: string;
  endDate: string;
  status: string;
  customer: Customer;
  membershipPlan: MembershipPlan;
}

export default function MembershipPlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"plans" | "memberships">("plans");

  // Plan Form Modal States
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [planName, setPlanName] = useState("");
  const [planPrice, setPlanPrice] = useState("");
  const [planDuration, setPlanDuration] = useState("");
  const [planBenefits, setPlanBenefits] = useState(""); // newline separated list

  // Assign Membership Form States
  const [assignCustomerId, setAssignCustomerId] = useState("");
  const [assignPlanId, setAssignPlanId] = useState("");
  const [assignStartDate, setAssignStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [customerSearch, setCustomerSearch] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, membershipsRes, customersRes] = await Promise.all([
        fetch("/api/membership-plans"),
        fetch("/api/memberships"),
        fetch("/api/customers"),
      ]);

      const plansData = await plansRes.json();
      const membershipsData = await membershipsRes.json();
      const customersData = await customersRes.json();

      setPlans(plansData.plans || []);
      setMemberships(membershipsData.memberships || []);
      setCustomers(customersData.customers || []);
    } catch (err) {
      console.error("Error loading membership details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter customers based on search text
  const filteredCustomers = customers.filter(
    (c) =>
      c.customerName.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phoneNumber.includes(customerSearch)
  );

  // Plan creation / adjustment submit handler
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName || !planPrice || !planDuration) {
      alert("Please fill in Name, Price, and Duration.");
      return;
    }

    const benefitsArray = planBenefits
      .split("\n")
      .map((b) => b.trim())
      .filter(Boolean);

    const payload = {
      name: planName,
      price: Number(planPrice),
      durationDays: Number(planDuration),
      benefits: JSON.stringify(benefitsArray),
    };

    try {
      const url = selectedPlan ? `/api/membership-plans/${selectedPlan.id}` : "/api/membership-plans";
      const method = selectedPlan ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(selectedPlan ? "Membership plan updated!" : "Membership plan created!");
        setShowPlanModal(false);
        fetchData();
      } else {
        alert(data.message || "Failed to save plan.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving plan.");
    }
  };

  const handleEditPlanClick = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setPlanName(plan.name);
    setPlanPrice(String(plan.price));
    setPlanDuration(String(plan.durationDays));

    let parsedBenefits = "";
    if (plan.benefits) {
      try {
        const parsed = JSON.parse(plan.benefits);
        parsedBenefits = Array.isArray(parsed) ? parsed.join("\n") : plan.benefits;
      } catch {
        parsedBenefits = plan.benefits;
      }
    }
    setPlanBenefits(parsedBenefits);
    setShowPlanModal(true);
  };

  const handleAddPlanClick = () => {
    setSelectedPlan(null);
    setPlanName("");
    setPlanPrice("");
    setPlanDuration("30");
    setPlanBenefits("Unlimited Washes\n10% Discount on Addons\nPriority Slot Booking");
    setShowPlanModal(true);
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm("Are you sure you want to delete this membership plan? Any existing memberships referencing this plan might cause query errors or be affected.")) {
      return;
    }
    try {
      const res = await fetch(`/api/membership-plans/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Plan deleted.");
        fetchData();
      } else {
        alert(data.message || "Failed to delete plan.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Assign membership submit handler
  const handleAssignMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignCustomerId || !assignPlanId || !assignStartDate) {
      alert("Please select customer, plan, and start date.");
      return;
    }

    try {
      setIsAssigning(true);
      const res = await fetch("/api/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: assignCustomerId,
          membershipPlanId: assignPlanId,
          startDate: assignStartDate,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("Membership plan assigned successfully!");
        setAssignCustomerId("");
        setAssignPlanId("");
        setCustomerSearch("");
        fetchData();
      } else {
        alert(data.message || "Failed to assign membership.");
      }
    } catch (err) {
      console.error(err);
      alert("Error assigning membership.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUpdateMembershipStatus = async (id: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to set this membership status to ${newStatus}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/memberships/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Membership status updated.");
        fetchData();
      } else {
        alert(data.message || "Failed to update membership.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMembership = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer's membership record permanently?")) {
      return;
    }
    try {
      const res = await fetch(`/api/memberships/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Membership record removed.");
        fetchData();
      } else {
        alert(data.message || "Failed to remove membership.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to parse benefits lists safely
  const renderBenefitsList = (benefitsStr: string | null) => {
    if (!benefitsStr) return null;
    try {
      const parsed = JSON.parse(benefitsStr);
      if (Array.isArray(parsed)) {
        return (
          <ul className="space-y-1.5 mt-3 text-xs text-gray-400">
            {parsed.map((benefit, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                <span className="text-red-500">✓</span> {benefit}
              </li>
            ))}
          </ul>
        );
      }
    } catch {
      // Return simple fallback if not valid JSON
    }
    return <p className="text-xs text-gray-400 mt-3">{benefitsStr}</p>;
  };

  return (
    <DashboardLayout title="Membership Plans & Tiers">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-red-500">
            Membership Manager
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Configure subscription tiers, outline wash benefits, and manually assign plans to customers.
          </p>
        </div>
        {activeTab === "plans" && (
          <button
            onClick={handleAddPlanClick}
            className="bg-red-600 hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-white font-semibold px-5 py-3 rounded-lg flex items-center gap-2 self-start md:self-auto shadow-lg shadow-red-900/30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add New Tier
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-800 mb-8">
        <button
          onClick={() => setActiveTab("plans")}
          className={`pb-4 px-2 font-bold text-sm transition-colors relative ${
            activeTab === "plans" ? "text-red-500" : "text-gray-400 hover:text-white"
          }`}
        >
          Membership Tiers ({plans.length})
          {activeTab === "plans" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-650" />}
        </button>
        <button
          onClick={() => setActiveTab("memberships")}
          className={`pb-4 px-2 font-bold text-sm transition-colors relative ${
            activeTab === "memberships" ? "text-red-500" : "text-gray-400 hover:text-white"
          }`}
        >
          Customer Subscriptions ({memberships.length})
          {activeTab === "memberships" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-650" />}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-20 text-center text-gray-500">
          Loading membership configs...
        </div>
      )}

      {/* Content Panels */}
      {!loading && activeTab === "plans" && (
        <div>
          {plans.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              No membership tiers configured yet. Click "Add New Tier" to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-[#0b0b0b] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between hover:border-gray-700 transition duration-300 shadow-xl"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold text-white uppercase">{plan.name}</h3>
                      <span className="bg-red-950/40 border border-red-800/40 text-red-400 text-xs px-2.5 py-1 rounded-full font-bold">
                        {plan.durationDays} Days
                      </span>
                    </div>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white">₹{plan.price}</span>
                      <span className="text-gray-500 text-xs">/ tier</span>
                    </div>

                    <div className="mt-4 border-t border-gray-850 pt-4">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan Benefits:</span>
                      {renderBenefitsList(plan.benefits)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-6 border-t border-gray-850 pt-4">
                    <button
                      onClick={() => handleEditPlanClick(plan)}
                      className="bg-transparent hover:bg-gray-800 border border-gray-850 text-gray-300 hover:text-white font-semibold py-2 rounded-xl text-xs transition"
                    >
                      Configure
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="bg-red-950/40 hover:bg-red-900 border border-red-800/40 hover:border-red-650 text-red-400 font-semibold py-2 rounded-xl text-xs transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && activeTab === "memberships" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel: Assign Membership */}
          <div className="lg:col-span-1">
            <div className="bg-[#0b0b0b] border border-gray-800 p-6 rounded-2xl shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4">Assign Membership</h2>
              <form onSubmit={handleAssignMembership} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                    Find Customer
                  </label>
                  <input
                    type="text"
                    placeholder="Search name or phone..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 text-sm transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                    Select Customer *
                  </label>
                  <select
                    value={assignCustomerId}
                    onChange={(e) => setAssignCustomerId(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 text-sm transition"
                  >
                    <option value="">-- Choose Customer --</option>
                    {filteredCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.customerName} ({c.phoneNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                    Select Plan Tier *
                  </label>
                  <select
                    value={assignPlanId}
                    onChange={(e) => setAssignPlanId(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 text-sm transition"
                  >
                    <option value="">-- Choose Tier --</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - ₹{p.price} ({p.durationDays} days)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={assignStartDate}
                    onChange={(e) => setAssignStartDate(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 text-sm transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAssigning}
                  className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all text-white font-bold py-3 rounded-xl shadow-lg shadow-red-900/30 text-sm"
                >
                  {isAssigning ? "Assigning..." : "Activate Membership"}
                </button>
              </form>
            </div>
          </div>

          {/* Right Panel: Subscription List */}
          <div className="lg:col-span-2">
            <div className="bg-[#0b0b0b] border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-850 bg-[#111]/40">
                <h2 className="text-xl font-bold text-white">Active Subscriptions Registry</h2>
              </div>

              {memberships.length === 0 ? (
                <div className="py-16 text-center text-gray-500 text-sm">
                  No active customer subscriptions found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#141414] text-gray-400 font-semibold uppercase tracking-wider text-xs border-b border-gray-800">
                      <tr>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Plan Tier</th>
                        <th className="px-6 py-4">Validity</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-850">
                      {memberships.map((m) => {
                        const isActive = m.status.toUpperCase() === "ACTIVE";
                        const isExpired = new Date(m.endDate) < new Date();

                        return (
                          <tr key={m.id} className="hover:bg-[#121212]/40 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-white">
                                {m.customer?.customerName || "Deleted Customer"}
                              </div>
                              <div className="text-gray-500 text-xs font-mono">
                                {m.customer?.phoneNumber || "N/A"}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-semibold text-red-400 text-xs uppercase bg-red-950/20 border border-red-900/30 px-2.5 py-1 rounded-full">
                                {m.membershipPlan?.name || "Deleted Plan"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-300">
                              <div>Start: {new Date(m.startDate).toLocaleDateString()}</div>
                              <div className="text-gray-500">End: {new Date(m.endDate).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4">
                              {isExpired ? (
                                <span className="text-gray-500 text-xs font-bold uppercase bg-gray-900 border border-gray-850 px-2 py-0.5 rounded-full">
                                  Expired
                                </span>
                              ) : isActive ? (
                                <span className="text-green-400 text-xs font-bold uppercase bg-green-950/20 border border-green-800/30 px-2 py-0.5 rounded-full">
                                  Active
                                </span>
                              ) : (
                                <span className="text-amber-500 text-xs font-bold uppercase bg-amber-950/20 border border-amber-800/30 px-2 py-0.5 rounded-full">
                                  {m.status}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              {isActive && !isExpired && (
                                <button
                                  onClick={() => handleUpdateMembershipStatus(m.id, "CANCELLED")}
                                  className="text-amber-500 hover:text-amber-400 text-xs bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1 rounded-md transition font-semibold"
                                >
                                  Terminate
                                </button>
                              )}
                              {!isActive && (
                                <button
                                  onClick={() => handleUpdateMembershipStatus(m.id, "ACTIVE")}
                                  className="text-green-400 hover:text-green-300 text-xs bg-green-500/10 hover:bg-green-500/20 px-3 py-1 rounded-md transition font-semibold"
                                >
                                  Re-Activate
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteMembership(m.id)}
                                className="text-red-500 hover:text-red-400 text-xs bg-red-500/10 hover:bg-red-500/20 px-3 py-1 rounded-md transition font-semibold"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Plan Form Modal (Create / Adjust) */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-gray-900 border border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl relative text-left">
            <h3 className="text-xl font-bold mb-2 text-white">
              {selectedPlan ? "Adjust Plan Config" : "Setup New Tier"}
            </h3>
            <p className="text-xs text-gray-400 mb-6">Specify tier name, access price, day coverage, and list rewards.</p>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Tier Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Gold Pass, Monthly Regular"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Price (Rs.) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 1999"
                    value={planPrice}
                    onChange={(e) => setPlanPrice(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 font-mono transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Duration (Days) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 30"
                    value={planDuration}
                    onChange={(e) => setPlanDuration(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 font-mono transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                  Tier Benefits (One per line)
                </label>
                <textarea
                  placeholder="Unlimited Sedan washes&#10;Free vaccuming&#10;10% on accessories"
                  value={planBenefits}
                  onChange={(e) => setPlanBenefits(e.target.value)}
                  rows={4}
                  className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-red-600 text-sm transition"
                />
              </div>

              <div className="flex gap-3 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl font-bold transition active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white py-3 rounded-xl font-bold transition active:scale-95 shadow-lg"
                >
                  Save Tier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
