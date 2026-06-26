"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Card from "@/components/ui/Card";
import KpiCard from "@/components/ui/KpiCard";

interface Customer {
  id: string;
  customerName: string;
  phoneNumber: string;
  email: string | null;
  vehicleType: string | null;
  preferredService: string | null;
  totalVisits: number;
  totalSpent: number;
  lastVisit: string | null;
  isBlacklisted: boolean;
  tag: string | null;
}

export default function CustomerPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({
    customerName: "",
    phoneNumber: "",
    email: "",
    tag: "",
    isBlacklisted: false,
    newPassword: "",
  });

  // Bulk action selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(customers.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const exportToCSV = () => {
    const selectedCustomers = customers.filter((c) => selectedIds.includes(c.id));
    const headers = ["Customer ID", "Customer Name", "Phone", "Email", "Vehicle Type", "Tag", "Total Visits", "Total Spent", "Blacklisted"];
    const rows = selectedCustomers.map((c) => [
      c.id,
      c.customerName,
      c.phoneNumber,
      c.email || "",
      c.vehicleType || "",
      c.tag || "",
      c.totalVisits,
      c.totalSpent,
      c.isBlacklisted ? "Yes" : "No"
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditClick = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditForm({
      customerName: customer.customerName,
      phoneNumber: customer.phoneNumber,
      email: customer.email || "",
      tag: customer.tag || "",
      isBlacklisted: customer.isBlacklisted || false,
      newPassword: "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingCustomer) return;
    try {
      const res = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: editForm.customerName,
          phoneNumber: editForm.phoneNumber,
          email: editForm.email || null,
          tag: editForm.tag || null,
          isBlacklisted: editForm.isBlacklisted,
          ...(editForm.newPassword ? { password: editForm.newPassword } : {})
        })
      });
      const data = await res.json();
      if (data.success) {
        setCustomers(customers.map(c => c.id === editingCustomer.id ? { ...c, ...data.customer } : c));
        setEditingCustomer(null);
      } else {
        alert(data.message || "Update failed");
      }
    } catch {
      alert("Error updating customer");
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/customers");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load customers");
      }

      setCustomers(data.customers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const totalCustomers = customers.length;
  const repeatCustomers = customers.filter((customer) => customer.totalVisits > 1).length;
  const totalRevenue = useMemo(
    () => customers.reduce((sum, customer) => sum + customer.totalSpent, 0),
    [customers]
  );
  const avgCustomerValue = totalCustomers
    ? Math.round(totalRevenue / totalCustomers)
    : 0;

  return (
    <DashboardLayout title="Customer CRM">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <KpiCard label="Total Customers" value={totalCustomers} color="text-blue-400" />
        <KpiCard label="Repeat Customers" value={repeatCustomers} color="text-green-400" />
        <KpiCard label="CRM Revenue" value={`Rs. ${totalRevenue}`} color="text-yellow-400" />
        <KpiCard
          label="Avg Customer Value"
          value={`Rs. ${avgCustomerValue}`}
          color="text-red-400"
        />
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Registered CRM Contacts</h2>
        <Link 
          href="/admin/customers/inactive" 
          className="bg-red-600/10 hover:bg-red-600 border border-red-900/30 hover:border-red-600 text-red-500 hover:text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer"
        >
          🎁 Launch Win-Back Campaigns
        </Link>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-red-950/20 border border-red-900/50 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="bg-red-600 text-white font-bold px-2.5 py-1 rounded text-xs">
              {selectedIds.length} SELECTED
            </span>
            <p className="text-sm text-gray-300">Export selected customer CRM records</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Export Selected CSV
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-gray-400 hover:text-white px-3 py-2 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <Card>
        {error ? <p className="text-red-400 mb-4">{error}</p> : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-red-600">
                <th className="p-3 text-center w-12">
                  <input
                    type="checkbox"
                    checked={customers.length > 0 && selectedIds.length === customers.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 accent-red-600 cursor-pointer rounded"
                  />
                </th>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-left">Contact</th>
                <th className="p-3 text-left">Tag / Status</th>
                <th className="p-3 text-left">Vehicle</th>
                <th className="p-3 text-left">Visits</th>
                <th className="p-3 text-left">Total Spent</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4" colSpan={8}>
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td className="p-4" colSpan={8}>
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-gray-800">
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(customer.id)}
                        onChange={() => handleSelectRow(customer.id)}
                        className="w-4 h-4 accent-red-600 cursor-pointer rounded"
                      />
                    </td>
                    <td className="p-3 font-medium">{customer.customerName}</td>
                    <td className="p-3">
                      <div>{customer.phoneNumber}</div>
                      <div className="text-xs text-gray-400">{customer.email || "-"}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1 items-start">
                        {customer.tag && (
                          <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-500/20 text-blue-400">
                            {customer.tag}
                          </span>
                        )}
                        {customer.isBlacklisted && (
                          <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-500/20 text-red-500">
                            Blacklisted
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">{customer.vehicleType || "-"}</td>
                    <td className="p-3 text-blue-400 font-bold">
                      {customer.totalVisits}
                    </td>
                    <td className="p-3 text-green-400 font-bold">
                      Rs. {customer.totalSpent}
                    </td>
                    <td className="p-3">
                      <button 
                        onClick={() => handleEditClick(customer)}
                        className="bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded text-sm transition"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Manage Customer</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Name</label>
                <input 
                  value={editForm.customerName} 
                  onChange={e => setEditForm({...editForm, customerName: e.target.value})} 
                  className="w-full bg-black border border-zinc-700 p-2 rounded" 
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Phone Number</label>
                <input 
                  value={editForm.phoneNumber} 
                  onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})} 
                  className="w-full bg-black border border-zinc-700 p-2 rounded" 
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Email</label>
                <input 
                  value={editForm.email} 
                  onChange={e => setEditForm({...editForm, email: e.target.value})} 
                  className="w-full bg-black border border-zinc-700 p-2 rounded" 
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Customer Tag (e.g. VIP, Staff)</label>
                <select 
                  value={editForm.tag} 
                  onChange={e => setEditForm({...editForm, tag: e.target.value})} 
                  className="w-full bg-black border border-zinc-700 p-2 rounded text-white"
                >
                  <option value="">None</option>
                  <option value="VIP">VIP</option>
                  <option value="Repeat">Repeat</option>
                  <option value="Family">Family</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">New Password (leave blank to keep current)</label>
                <input 
                  type="password"
                  placeholder="Enter new password to override"
                  value={editForm.newPassword} 
                  onChange={e => setEditForm({...editForm, newPassword: e.target.value})} 
                  className="w-full bg-black border border-zinc-700 p-2 rounded" 
                />
              </div>

              <div className="flex items-center gap-2 mt-4 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <input 
                  type="checkbox" 
                  id="blacklist"
                  checked={editForm.isBlacklisted} 
                  onChange={e => setEditForm({...editForm, isBlacklisted: e.target.checked})} 
                  className="w-4 h-4 accent-red-600"
                />
                <label htmlFor="blacklist" className="text-red-400 font-bold">Blacklist Customer</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setEditingCustomer(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition font-bold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
