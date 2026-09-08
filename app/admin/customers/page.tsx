"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { 
  Users, 
  Crown, 
  RefreshCw, 
  Sparkles, 
  Search, 
  ArrowUpDown, 
  SlidersHorizontal,
  Download,
  AlertTriangle,
  Edit2,
  CheckCircle2,
  Phone,
  Mail,
  Car
} from "lucide-react";

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

type SortOption = 
  | "revenue-desc" 
  | "revenue-asc" 
  | "visits-desc" 
  | "visits-asc" 
  | "name-asc" 
  | "name-desc" 
  | "recent";

type TagFilterOption = "ALL" | "VIP" | "REGULAR" | "NEW" | "BLACKLISTED";

export default function CustomerPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("revenue-desc");
  const [tagFilter, setTagFilter] = useState<TagFilterOption>("ALL");

  // Edit Modal State
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({
    customerName: "",
    phoneNumber: "",
    email: "",
    vehicleType: "",
    tag: "",
    isBlacklisted: false,
    newPassword: "",
  });

  // Bulk action selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  // Filter & Sort Customers
  const filteredAndSortedCustomers = useMemo(() => {
    return customers
      .filter((customer) => {
        // Tag filter
        if (tagFilter === "VIP" && customer.tag !== "VIP") return false;
        if (tagFilter === "REGULAR" && customer.tag !== "REGULAR") return false;
        if (tagFilter === "NEW" && customer.tag !== "NEW") return false;
        if (tagFilter === "BLACKLISTED" && !customer.isBlacklisted) return false;

        // Search filter
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        const name = (customer.customerName || "").toLowerCase();
        const phone = (customer.phoneNumber || "").toLowerCase();
        const email = (customer.email || "").toLowerCase();
        const vehicle = (customer.vehicleType || "").toLowerCase();
        const id = (customer.id || "").toLowerCase();

        return name.includes(q) || phone.includes(q) || email.includes(q) || vehicle.includes(q) || id.includes(q);
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "revenue-desc":
            return (b.totalSpent || 0) - (a.totalSpent || 0);
          case "revenue-asc":
            return (a.totalSpent || 0) - (b.totalSpent || 0);
          case "visits-desc":
            return (b.totalVisits || 0) - (a.totalVisits || 0);
          case "visits-asc":
            return (a.totalVisits || 0) - (b.totalVisits || 0);
          case "name-asc":
            return (a.customerName || "").localeCompare(b.customerName || "");
          case "name-desc":
            return (b.customerName || "").localeCompare(a.customerName || "");
          case "recent":
          default:
            return 0; // default order from API
        }
      });
  }, [customers, searchTerm, sortBy, tagFilter]);

  // Bulk Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredAndSortedCustomers.map((c) => c.id));
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
    const listToExport = selectedCustomers.length > 0 ? selectedCustomers : filteredAndSortedCustomers;
    
    const headers = [
      "Customer ID", 
      "Customer Name", 
      "Phone", 
      "Email", 
      "Vehicle Type", 
      "Auto Tag", 
      "Total Visits", 
      "Total Spent (INR)", 
      "Last Visit", 
      "Blacklisted"
    ];

    const rows = listToExport.map((c) => [
      c.id,
      c.customerName,
      c.phoneNumber,
      c.email || "",
      c.vehicleType || "",
      c.tag || "",
      c.totalVisits,
      c.totalSpent,
      c.lastVisit || "",
      c.isBlacklisted ? "Yes" : "No"
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `customers_crm_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditClick = (customer: Customer) => {
    setEditingCustomer(customer);
    setSaveMessage(null);
    setEditForm({
      customerName: customer.customerName || "",
      phoneNumber: customer.phoneNumber === "N/A" ? "" : customer.phoneNumber,
      email: customer.email || "",
      vehicleType: customer.vehicleType || "",
      tag: customer.tag || "",
      isBlacklisted: customer.isBlacklisted || false,
      newPassword: "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingCustomer) return;
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch(`/api/customers/${encodeURIComponent(editingCustomer.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: editForm.customerName.trim(),
          phoneNumber: editForm.phoneNumber.trim() || null,
          email: editForm.email.trim() || null,
          vehicleType: editForm.vehicleType.trim() || null,
          tag: editForm.tag || null,
          isBlacklisted: editForm.isBlacklisted,
          ...(editForm.newPassword ? { password: editForm.newPassword } : {})
        })
      });

      const data = await res.json();
      if (data.success && data.customer) {
        // Refresh customer list locally
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === editingCustomer.id
              ? {
                  ...c,
                  customerName: data.customer.customerName,
                  phoneNumber: data.customer.phoneNumber,
                  email: data.customer.email,
                  vehicleType: data.customer.vehicleType,
                  tag: data.customer.tag,
                  isBlacklisted: data.customer.isBlacklisted,
                }
              : c
          )
        );
        setSaveMessage({ type: "success", text: "Customer details updated successfully!" });
        setTimeout(() => {
          setEditingCustomer(null);
          setSaveMessage(null);
        }, 1200);
      } else {
        setSaveMessage({ type: "error", text: data.message || "Failed to update customer" });
      }
    } catch (err: any) {
      setSaveMessage({ type: "error", text: err?.message || "Network error while updating customer" });
    } finally {
      setIsSaving(false);
    }
  };

  // KPI Calculations
  const totalCustomers = customers.length;
  const vipCustomersCount = useMemo(() => customers.filter((c) => c.tag === "VIP").length, [customers]);
  const regularCustomersCount = useMemo(() => customers.filter((c) => c.tag === "REGULAR").length, [customers]);
  const newCustomersCount = useMemo(() => customers.filter((c) => c.tag === "NEW").length, [customers]);
  const totalRevenue = useMemo(
    () => customers.reduce((sum, customer) => sum + (customer.totalSpent || 0), 0),
    [customers]
  );
  const avgCustomerValue = totalCustomers
    ? Math.round(totalRevenue / totalCustomers)
    : 0;

  // Tag Badge Renderer
  const renderTagBadge = (tag: string | null, isBlacklisted: boolean) => {
    if (isBlacklisted) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
          <AlertTriangle className="w-3 h-3" /> Blacklisted
        </span>
      );
    }

    switch (tag) {
      case "VIP":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10">
            <Crown className="w-3 h-3 text-amber-400 fill-amber-400/20" /> VIP (₹3k+ / 5+ visits)
          </span>
        );
      case "REGULAR":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10">
            <RefreshCw className="w-3 h-3 text-emerald-400" /> REGULAR (2+ visits)
          </span>
        );
      case "NEW":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-500/15 text-sky-300 border border-sky-500/30">
            <Sparkles className="w-3 h-3 text-sky-400" /> NEW
          </span>
        );
      default:
        return tag ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {tag}
          </span>
        ) : (
          <span className="text-xs text-zinc-500">—</span>
        );
    }
  };

  return (
    <DashboardLayout title="Customer CRM & Segmentation">
      {/* Top Stat Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <KpiCard 
          label="Total Contacts" 
          value={totalCustomers} 
          color="text-blue-400" 
        />
        <KpiCard 
          label="⭐ VIP Tier" 
          value={vipCustomersCount} 
          color="text-amber-400" 
        />
        <KpiCard 
          label="🔁 Regular Tier" 
          value={regularCustomersCount} 
          color="text-emerald-400" 
        />
        <KpiCard 
          label="✨ New Customers" 
          value={newCustomersCount} 
          color="text-sky-400" 
        />
        <KpiCard 
          label="Lifetime Revenue" 
          value={`₹${totalRevenue.toLocaleString("en-IN")}`} 
          color="text-green-400" 
        />
      </div>

      {/* Action and Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-red-500" /> 
            Customer Relationship Directory
          </h2>
          <p className="text-sm text-zinc-400 mt-0.5">
            Auto-segmented by visits & spend threshold. Sort or filter dynamically.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-zinc-400" />
            Export CSV {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
          </button>
          <Link 
            href="/admin/customers/inactive" 
            className="flex items-center gap-2 bg-red-600/15 hover:bg-red-600 border border-red-900/40 hover:border-red-600 text-red-400 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            🎁 Launch Win-Back Campaigns
          </Link>
        </div>
      </div>

      {/* Search, Sort & Tag Filter Controls */}
      <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl mb-6 shadow-lg backdrop-blur-md">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
          
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, phone, email, vehicle, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950/70 border border-zinc-700/80 text-white pl-10 pr-4 py-2 rounded-xl text-sm placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white bg-zinc-800 px-1.5 py-0.5 rounded"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="md:col-span-4 flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-zinc-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full bg-zinc-950/70 border border-zinc-700/80 text-white px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition cursor-pointer"
            >
              <option value="revenue-desc">💰 Sort by Revenue: High to Low</option>
              <option value="revenue-asc">💰 Sort by Revenue: Low to High</option>
              <option value="visits-desc">🚗 Sort by Visits: Most to Least</option>
              <option value="visits-asc">🚗 Sort by Visits: Least to Most</option>
              <option value="name-asc">🔤 Sort by Name: A → Z</option>
              <option value="name-desc">🔤 Sort by Name: Z → A</option>
              <option value="recent">⚡ Default (Recent Activity)</option>
            </select>
          </div>

          {/* Tag Quick Filter Pills */}
          <div className="md:col-span-3 flex items-center justify-start md:justify-end gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-zinc-400 flex items-center gap-1 mr-1">
              <SlidersHorizontal className="w-3 h-3" /> Tag:
            </span>
            {(["ALL", "VIP", "REGULAR", "NEW", "BLACKLISTED"] as TagFilterOption[]).map((tag) => (
              <button
                key={tag}
                onClick={() => setTagFilter(tag)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                  tagFilter === tag
                    ? tag === "VIP"
                      ? "bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20"
                      : tag === "REGULAR"
                      ? "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20"
                      : tag === "NEW"
                      ? "bg-sky-500 text-black font-bold shadow-md shadow-sky-500/20"
                      : tag === "BLACKLISTED"
                      ? "bg-rose-600 text-white font-bold"
                      : "bg-red-600 text-white font-bold"
                    : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Bulk Selection Notification Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-red-950/40 border border-red-800/60 p-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="bg-red-600 text-white font-bold px-2.5 py-1 rounded text-xs shadow-sm">
              {selectedIds.length} SELECTED
            </span>
            <p className="text-xs text-zinc-300">
              Bulk export or manage selected customer records.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Export ({selectedIds.length}) Selected CSV
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-zinc-400 hover:text-white px-3 py-1.5 text-xs font-semibold transition cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Customer Directory Table */}
      <Card>
        {error ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm mb-4">
            {error}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left border-collapse">
            <thead>
              <tr className="bg-zinc-800/80 border-b border-zinc-700 text-xs uppercase tracking-wider text-zinc-300 font-semibold">
                <th className="p-3 text-center w-12">
                  <input
                    type="checkbox"
                    checked={
                      filteredAndSortedCustomers.length > 0 &&
                      selectedIds.length === filteredAndSortedCustomers.length
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 accent-red-600 cursor-pointer rounded"
                  />
                </th>
                <th className="p-3">Customer Info</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Auto Tag / Tier</th>
                <th className="p-3">Vehicle</th>
                <th 
                  className="p-3 cursor-pointer hover:text-red-400 transition"
                  onClick={() => setSortBy(sortBy === "visits-desc" ? "visits-asc" : "visits-desc")}
                >
                  <div className="flex items-center gap-1">
                    Visits
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="p-3 cursor-pointer hover:text-red-400 transition"
                  onClick={() => setSortBy(sortBy === "revenue-desc" ? "revenue-asc" : "revenue-desc")}
                >
                  <div className="flex items-center gap-1">
                    Total Spent
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-sm">
              {loading ? (
                <tr>
                  <td className="p-8 text-center text-zinc-400" colSpan={8}>
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-red-500" />
                      Loading customers and calculating tier tags...
                    </div>
                  </td>
                </tr>
              ) : filteredAndSortedCustomers.length === 0 ? (
                <tr>
                  <td className="p-8 text-center text-zinc-500" colSpan={8}>
                    {searchTerm || tagFilter !== "ALL"
                      ? "No customers match your search and filter criteria."
                      : "No customer records found."}
                  </td>
                </tr>
              ) : (
                filteredAndSortedCustomers.map((customer) => (
                  <tr 
                    key={customer.id} 
                    className="hover:bg-zinc-800/40 transition group"
                  >
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(customer.id)}
                        onChange={() => handleSelectRow(customer.id)}
                        className="w-4 h-4 accent-red-600 cursor-pointer rounded"
                      />
                    </td>

                    {/* Customer Info */}
                    <td className="p-3">
                      <div className="font-semibold text-white group-hover:text-red-400 transition">
                        {customer.customerName}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        ID: {customer.id}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 text-zinc-200">
                        <Phone className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span>{customer.phoneNumber || "N/A"}</span>
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                          <Mail className="w-3 h-3 text-zinc-500 shrink-0" />
                          <span className="truncate max-w-[160px]">{customer.email}</span>
                        </div>
                      )}
                    </td>

                    {/* Auto Tag */}
                    <td className="p-3">
                      {renderTagBadge(customer.tag, customer.isBlacklisted)}
                    </td>

                    {/* Vehicle */}
                    <td className="p-3">
                      {customer.vehicleType ? (
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-700/60">
                          <Car className="w-3 h-3 text-zinc-400" />
                          {customer.vehicleType}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-500">—</span>
                      )}
                    </td>

                    {/* Visits */}
                    <td className="p-3">
                      <span className="inline-block font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 text-xs">
                        {customer.totalVisits} {customer.totalVisits === 1 ? "visit" : "visits"}
                      </span>
                    </td>

                    {/* Total Spent */}
                    <td className="p-3">
                      <span className="inline-block font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-xs font-mono">
                        ₹{(customer.totalSpent || 0).toLocaleString("en-IN")}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => handleEditClick(customer)}
                        className="inline-flex items-center gap-1.5 bg-zinc-800 hover:bg-red-600/90 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border border-zinc-700/80 hover:border-red-500"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-red-500" />
                  Edit Customer Information
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  ID: <span className="font-mono text-zinc-300">{editingCustomer.id}</span>
                </p>
              </div>
              <button
                onClick={() => setEditingCustomer(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 text-lg transition"
              >
                ✕
              </button>
            </div>

            {saveMessage && (
              <div 
                className={`p-3 rounded-xl text-xs font-medium mb-4 flex items-center gap-2 ${
                  saveMessage.type === "success" 
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" 
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                }`}
              >
                {saveMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                {saveMessage.text}
              </div>
            )}
            
            <div className="space-y-3.5 max-h-[65vh] overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Customer Full Name *</label>
                <input 
                  value={editForm.customerName} 
                  onChange={e => setEditForm({...editForm, customerName: e.target.value})} 
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-zinc-950 border border-zinc-700/80 p-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Phone Number</label>
                  <input 
                    value={editForm.phoneNumber} 
                    onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})} 
                    placeholder="10-digit mobile"
                    className="w-full bg-zinc-950 border border-zinc-700/80 p-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition" 
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Email (Optional)</label>
                  <input 
                    type="email"
                    value={editForm.email} 
                    onChange={e => setEditForm({...editForm, email: e.target.value})} 
                    placeholder="name@example.com"
                    className="w-full bg-zinc-950 border border-zinc-700/80 p-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Vehicle Type / Model</label>
                  <input 
                    value={editForm.vehicleType} 
                    onChange={e => setEditForm({...editForm, vehicleType: e.target.value})} 
                    placeholder="e.g. SUV, Creta, Sedan"
                    className="w-full bg-zinc-950 border border-zinc-700/80 p-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition" 
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Customer Tier / Tag</label>
                  <select 
                    value={editForm.tag} 
                    onChange={e => setEditForm({...editForm, tag: e.target.value})} 
                    className="w-full bg-zinc-950 border border-zinc-700/80 p-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition cursor-pointer"
                  >
                    <option value="">Auto-Assign (Based on Spend/Visits)</option>
                    <option value="VIP">⭐ VIP (High Value)</option>
                    <option value="REGULAR">🔁 REGULAR (Frequent Visitor)</option>
                    <option value="NEW">✨ NEW (Recent Onboarding)</option>
                    <option value="Staff">👤 Staff Member</option>
                    <option value="Family">❤️ Family & Friends</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Set / Reset Password (Optional)</label>
                <input 
                  type="password"
                  placeholder="Leave blank to keep unchanged"
                  value={editForm.newPassword} 
                  onChange={e => setEditForm({...editForm, newPassword: e.target.value})} 
                  className="w-full bg-zinc-950 border border-zinc-700/80 p-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition" 
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-rose-500/10 rounded-xl border border-rose-500/30">
                <input 
                  type="checkbox" 
                  id="blacklist"
                  checked={editForm.isBlacklisted} 
                  onChange={e => setEditForm({...editForm, isBlacklisted: e.target.checked})} 
                  className="w-4 h-4 accent-rose-600 cursor-pointer"
                />
                <label htmlFor="blacklist" className="text-xs font-semibold text-rose-400 cursor-pointer">
                  Blacklist this customer from loyalty bonuses & bookings
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t border-zinc-800 pt-4">
              <button 
                onClick={() => setEditingCustomer(null)}
                disabled={isSaving}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={isSaving || !editForm.customerName.trim()}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition cursor-pointer shadow-lg shadow-red-600/30 disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
