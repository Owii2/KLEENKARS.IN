"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Users,
  MapPin,
  Phone,
  Mail,
  Shield,
  Search,
  CheckCircle,
  X,
  Sparkles,
  UserCheck,
  Briefcase
} from "lucide-react";

interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  role: string;
  status: string;
  phoneNumber?: string;
}

interface Branch {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  managerName?: string | null;
  isActive: boolean;
  employees: Employee[];
  createdAt: string;
  updatedAt: string;
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [assigningBranch, setAssigningBranch] = useState<Branch | null>(null);

  // Form states
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCity, setFormCity] = useState("Delhi");
  const [formState, setFormState] = useState("Delhi");
  const [formPincode, setFormPincode] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formManagerName, setFormManagerName] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formAssignedStaffIds, setFormAssignedStaffIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [branchesRes, employeesRes] = await Promise.all([
        fetch("/api/branches", { cache: "no-store" }),
        fetch("/api/employees", { cache: "no-store" }),
      ]);

      const branchesData = await branchesRes.json();
      const employeesData = await employeesRes.json();

      setBranches(branchesData.branches || []);
      setAllEmployees(employeesData.employees || []);
    } catch (error) {
      console.error("Failed to load branches:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setFormCode(`KK-${String(branches.length + 1).padStart(2, "0")}`);
    setFormName("");
    setFormAddress("");
    setFormCity("Delhi");
    setFormState("Delhi");
    setFormPincode("");
    setFormPhone("+91 ");
    setFormEmail("");
    setFormManagerName("");
    setFormIsActive(true);
    setFormAssignedStaffIds([]);
    setShowCreateModal(true);
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setFormCode(branch.code);
    setFormName(branch.name);
    setFormAddress(branch.address || "");
    setFormCity(branch.city || "Delhi");
    setFormState(branch.state || "Delhi");
    setFormPincode(branch.pincode || "");
    setFormPhone(branch.phone || "");
    setFormEmail(branch.email || "");
    setFormManagerName(branch.managerName || "");
    setFormIsActive(branch.isActive);
    setFormAssignedStaffIds(branch.employees.map((e) => e.id));
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode || !formName) {
      alert("Branch Code and Name are required");
      return;
    }

    try {
      setSubmitting(true);
      const url = editingBranch ? `/api/branches/${editingBranch.id}` : "/api/branches";
      const method = editingBranch ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formCode,
          name: formName,
          address: formAddress,
          city: formCity,
          state: formState,
          pincode: formPincode,
          phone: formPhone,
          email: formEmail,
          managerName: formManagerName,
          isActive: formIsActive,
          assignedEmployeeIds: formAssignedStaffIds,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(editingBranch ? "✅ Branch updated successfully!" : "✅ New branch created successfully!");
        setShowCreateModal(false);
        setEditingBranch(null);
        fetchData();
      } else {
        alert(data.message || "Failed to save branch");
      }
    } catch (err: any) {
      alert("Error saving branch details");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBranch = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete branch "${name}"? All assigned staff will be unassigned.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/branches/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        fetchData();
      } else {
        alert(data.message || "Failed to delete branch");
      }
    } catch (e) {
      alert("Error deleting branch");
    }
  };

  const toggleStaffAssignment = (empId: string) => {
    setFormAssignedStaffIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  // Quick Staff Assignment Submit
  const handleQuickAssignStaff = async () => {
    if (!assigningBranch) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/branches/${assigningBranch.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeIds: formAssignedStaffIds }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        setAssigningBranch(null);
        fetchData();
      } else {
        alert(data.message || "Failed to assign staff");
      }
    } catch (e) {
      alert("Error assigning staff");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered branches
  const filteredBranches = branches.filter((b) => {
    const matchSearch =
      !searchQuery ||
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.city && b.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.managerName && b.managerName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCity = cityFilter === "all" || (b.city && b.city.toLowerCase() === cityFilter.toLowerCase());
    return matchSearch && matchCity;
  });

  const uniqueCities = Array.from(new Set(branches.map((b) => b.city || "Delhi")));
  const totalAssignedStaff = branches.reduce((sum, b) => sum + (b.employees?.length || 0), 0);

  return (
    <DashboardLayout title="Branches & Center Management">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <Building2 className="w-8 h-8 text-red-500" />
              Branches & Detailing Hubs
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Create, configure, and assign staff crews across multiple Kleenkars physical detailing centers.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-red-650 hover:bg-red-700 active:scale-[0.98] transition-all text-white font-bold px-5 py-3 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-red-900/30"
          >
            <Plus className="w-5 h-5" />
            Add New Branch
          </button>
        </div>

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0b0b0b] p-5 rounded-2xl border border-gray-850 flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Stations</span>
            <span className="text-3xl font-extrabold mt-2 text-white font-mono">{branches.filter((b) => b.isActive).length}</span>
            <span className="text-[10px] text-gray-500 mt-1">Out of {branches.length} registered</span>
          </div>
          <div className="bg-[#0b0b0b] p-5 rounded-2xl border border-gray-850 flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Assigned Crew Members</span>
            <span className="text-3xl font-extrabold mt-2 text-amber-400 font-mono">{totalAssignedStaff}</span>
            <span className="text-[10px] text-gray-500 mt-1">Across all detailing bays</span>
          </div>
          <div className="bg-[#0b0b0b] p-5 rounded-2xl border border-gray-850 flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Cities Operational</span>
            <span className="text-3xl font-extrabold mt-2 text-cyan-400 font-mono">{uniqueCities.length}</span>
            <span className="text-[10px] text-gray-500 mt-1">{uniqueCities.join(", ")}</span>
          </div>
          <div className="bg-[#0b0b0b] p-5 rounded-2xl border border-gray-850 flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Available Workforce</span>
            <span className="text-3xl font-extrabold mt-2 text-green-400 font-mono">{allEmployees.length}</span>
            <span className="text-[10px] text-gray-500 mt-1">Total registered staff</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-[#0b0b0b] border border-gray-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search branch code, name, city, or manager..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-red-600 transition"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setCityFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                cityFilter === "all" ? "bg-red-650 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              All Cities
            </button>
            {uniqueCities.map((city) => (
              <button
                key={city}
                onClick={() => setCityFilter(city)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  cityFilter.toLowerCase() === city.toLowerCase()
                    ? "bg-red-650 text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Branch Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-gray-500 flex flex-col items-center justify-center min-h-[40vh] gap-3">
            <div className="animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full" />
            <p className="text-sm font-semibold font-mono">Loading Branch Network...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBranches.map((b) => (
              <div
                key={b.id}
                className="bg-[#0b0b0b] border border-gray-800 hover:border-gray-700 transition-all rounded-2xl p-6 flex flex-col justify-between gap-6 shadow-xl relative group"
              >
                {/* Branch Header */}
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="bg-red-950/40 text-red-400 border border-red-800/40 text-xs font-mono font-extrabold px-2.5 py-1 rounded-lg">
                        {b.code}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          b.isActive
                            ? "bg-green-950/40 text-green-400 border-green-800/40"
                            : "bg-gray-900 text-gray-500 border-gray-800"
                        }`}
                      >
                        {b.isActive ? "Active Hub" : "Inactive"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={() => openEditModal(b)}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-cyan-400 transition"
                        title="Edit Branch"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBranch(b.id, b.name)}
                        className="p-1.5 hover:bg-red-900/40 rounded-lg text-red-400 transition"
                        title="Delete Branch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mt-3">{b.name}</h3>

                  {/* Location & Contact Info */}
                  <div className="mt-4 space-y-2 text-xs text-gray-400">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <span>
                        {b.address ? `${b.address}, ` : ""}
                        {b.city || "Delhi"}
                        {b.pincode ? ` - ${b.pincode}` : ""}
                      </span>
                    </div>
                    {b.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-mono">{b.phone}</span>
                      </div>
                    )}
                    {b.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="truncate">{b.email}</span>
                      </div>
                    )}
                    {b.managerName && (
                      <div className="flex items-center gap-2 pt-1">
                        <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-white font-medium">Lead: <strong className="font-bold">{b.managerName}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Assigned Crew Block */}
                <div className="border-t border-gray-850 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-gray-500" />
                      Assigned Crew ({b.employees?.length || 0})
                    </span>
                    <button
                      onClick={() => {
                        setAssigningBranch(b);
                        setFormAssignedStaffIds(b.employees.map((e) => e.id));
                      }}
                      className="text-xs font-bold text-red-400 hover:text-red-300 transition flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Manage Crew
                    </button>
                  </div>

                  {b.employees && b.employees.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {b.employees.map((emp) => (
                        <span
                          key={emp.id}
                          className="bg-white/5 border border-white/10 text-gray-300 text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {emp.name}
                          <span className="text-[9px] text-gray-500 uppercase">({emp.role})</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 italic">No staff members assigned to this hub yet.</p>
                  )}
                </div>
              </div>
            ))}

            {filteredBranches.length === 0 && (
              <div className="col-span-full py-16 text-center text-gray-500 bg-[#0b0b0b] rounded-2xl border border-gray-800">
                <Building2 className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-sm font-semibold">No branches matching your filter criteria.</p>
                <button
                  onClick={openCreateModal}
                  className="mt-4 bg-red-650 text-white text-xs font-bold px-4 py-2 rounded-xl"
                >
                  Create New Branch
                </button>
              </div>
            )}
          </div>
        )}

        {/* CREATE / EDIT BRANCH MODAL */}
        {(showCreateModal || editingBranch) && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 w-full max-w-xl shadow-2xl relative text-left">
              <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-5">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-red-500" />
                  {editingBranch ? `Edit Branch: ${editingBranch.name}` : "Create New Detailing Branch"}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingBranch(null);
                  }}
                  className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBranch} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                      Branch Code *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ROHINI-01, NOIDA-02"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                      className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-red-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                      Branch Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rohini Flagship Center"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-600"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                    Address / Landmark
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sector 7, Near Metro Station"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">City</label>
                    <input
                      type="text"
                      placeholder="e.g. Delhi, Noida"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">State</label>
                    <input
                      type="text"
                      placeholder="Delhi, UP"
                      value={formState}
                      onChange={(e) => setFormState(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Pincode</label>
                    <input
                      type="text"
                      placeholder="110085"
                      value={formPincode}
                      onChange={(e) => setFormPincode(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-600 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Official Phone</label>
                    <input
                      type="text"
                      placeholder="+91 8650007661"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Center Email</label>
                    <input
                      type="email"
                      placeholder="branch@kleenkars.in"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                      Branch Operations Manager
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Furkan Khan"
                      value={formManagerName}
                      onChange={(e) => setFormManagerName(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Status</label>
                    <select
                      value={formIsActive ? "active" : "inactive"}
                      onChange={(e) => setFormIsActive(e.target.value === "active")}
                      className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-600"
                    >
                      <option value="active">Active Station</option>
                      <option value="inactive">Temporarily Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Staff Assignment Multi-Select */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    Assign Staff Members to this Branch ({formAssignedStaffIds.length} Selected)
                  </label>
                  <div className="bg-black/60 border border-white/10 rounded-xl p-3 max-h-36 overflow-y-auto grid grid-cols-2 gap-2">
                    {allEmployees.map((emp) => {
                      const isSelected = formAssignedStaffIds.includes(emp.id);
                      return (
                        <div
                          key={emp.id}
                          onClick={() => toggleStaffAssignment(emp.id)}
                          className={`p-2 rounded-lg text-xs font-semibold cursor-pointer border flex items-center justify-between transition ${
                            isSelected
                              ? "bg-red-950/40 text-white border-red-600"
                              : "bg-white/5 text-gray-400 border-transparent hover:bg-white/10"
                          }`}
                        >
                          <div>
                            <div className="font-bold">{emp.name}</div>
                            <div className="text-[10px] text-gray-500 capitalize">{emp.role}</div>
                          </div>
                          {isSelected && <CheckCircle className="w-4 h-4 text-red-500" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingBranch(null);
                    }}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl font-bold transition text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-red-650 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition text-sm shadow-lg shadow-red-900/30"
                  >
                    {submitting ? "Saving..." : editingBranch ? "Update Branch" : "Create Branch"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MANAGE CREW MODAL */}
        {assigningBranch && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl text-left">
              <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-5">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="w-6 h-6 text-red-500" />
                    Manage Crew: {assigningBranch.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Select crew members to allocate to {assigningBranch.code}</p>
                </div>
                <button
                  onClick={() => setAssigningBranch(null)}
                  className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto mb-6 pr-1">
                {allEmployees.map((emp) => {
                  const isSelected = formAssignedStaffIds.includes(emp.id);
                  return (
                    <div
                      key={emp.id}
                      onClick={() => toggleStaffAssignment(emp.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        isSelected
                          ? "bg-red-950/40 border-red-600 text-white"
                          : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-600/20 text-red-400 font-bold flex items-center justify-center text-xs">
                          {emp.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-sm">{emp.name}</div>
                          <div className="text-xs text-gray-500 font-mono">
                            {emp.employeeCode} • <span className="capitalize">{emp.role}</span>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition ${
                          isSelected ? "bg-red-600 border-red-600 text-white" : "border-gray-600"
                        }`}
                      >
                        {isSelected && <CheckCircle className="w-4 h-4" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setAssigningBranch(null)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl font-bold transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleQuickAssignStaff}
                  disabled={submitting}
                  className="flex-1 bg-red-650 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition text-sm shadow-lg"
                >
                  {submitting ? "Saving..." : `Save Crew (${formAssignedStaffIds.length})`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
