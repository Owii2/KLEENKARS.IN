"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Card from "@/components/ui/Card";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  isActive: boolean;
}

const BASE_VEHICLE_OPTIONS = [
  { value: "All", label: "All Vehicles (No Suffix)" },
  { value: "Bike", label: "Bike" },
  { value: "Hatchback", label: "Hatchback" },
  { value: "Sedan", label: "Sedan" },
  { value: "SUV", label: "SUV" },
  { value: "MUV", label: "MUV" },
  { value: "SUV/MUV", label: "SUV/MUV (Combined)" },
  { value: "Luxury", label: "Luxury / Exotic" },
  { value: "Truck/Traveller", label: "Truck / Traveller" },
  { value: "Truck", label: "Truck" },
  { value: "Van", label: "Van" },
  { value: "Traveller", label: "Traveller" },
  { value: "Bus", label: "Bus" },
  { value: "E-Rickshaw", label: "E-Rickshaw" },
  { value: "Tractor", label: "Tractor" },
  { value: "Others", label: "Others" }
];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const getEditOptions = () => {
    const currentVal = form.vehicleTypes[0] || "All";
    const exists = BASE_VEHICLE_OPTIONS.some(opt => opt.value === currentVal);
    if (exists) return BASE_VEHICLE_OPTIONS;
    return [{ value: currentVal, label: currentVal }, ...BASE_VEHICLE_OPTIONS];
  };

  const [form, setForm] = useState({
    baseName: "",
    vehicleTypes: ["All"] as string[],
    description: "",
    price: "",
    category: "Wash",
    isActive: true,
  });

  const fetchServices = async () => {
    setLoading(true);
    const res = await fetch("/api/services");
    const data = await res.json();
    if (data.success) {
      setServices(data.services);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleEdit = (svc: Service) => {
    setEditingId(svc.id);
    const vehicleSpecificServicePattern = /^(.+?)\s*-\s*([A-Za-z0-9\/\-\s]+)$/i;
    const match = svc.name.match(vehicleSpecificServicePattern);
    const baseName = match ? match[1].trim() : svc.name;

    const relatedServices = services.filter(s => {
      const sm = s.name.match(vehicleSpecificServicePattern);
      const sBase = sm ? sm[1].trim() : s.name;
      return sBase.toLowerCase() === baseName.toLowerCase() && (s.isActive || s.id === svc.id);
    });

    const activeVehicleTypes = relatedServices.map(s => {
      const sm = s.name.match(vehicleSpecificServicePattern);
      return sm ? sm[2].trim() : "All";
    });

    setForm({
      baseName,
      vehicleTypes: activeVehicleTypes.length > 0 ? activeVehicleTypes : ["All"],
      description: svc.description || "",
      price: svc.price.toString(),
      category: svc.category || "Wash",
      isActive: svc.isActive,
    });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingId(null);
    setForm({
      baseName: "",
      vehicleTypes: ["All"],
      description: "",
      price: "",
      category: "Wash",
      isActive: true,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.baseName.trim()) {
      alert("Service Name is required");
      return;
    }
    if (!form.price || isNaN(parseInt(form.price))) {
      alert("Price must be a valid number");
      return;
    }
    if (form.vehicleTypes.length === 0) {
      alert("Please select at least one vehicle type");
      return;
    }

    const priceVal = parseInt(form.price) || 0;

    if (editingId) {
      // Editing a service. Reconcile database records for this service group.
      const originalSvc = services.find(s => s.id === editingId);
      if (!originalSvc) return;

      const vehicleSpecificServicePattern = /^(.+?)\s*-\s*([A-Za-z0-9\/\-\s]+)$/i;
      const originalMatch = originalSvc.name.match(vehicleSpecificServicePattern);
      const originalBaseName = originalMatch ? originalMatch[1].trim() : originalSvc.name;

      // Find all variants currently in the database sharing the original base name
      const originalVariants = services.filter(s => {
        const sm = s.name.match(vehicleSpecificServicePattern);
        const sBase = sm ? sm[1].trim() : s.name;
        return sBase.toLowerCase() === originalBaseName.toLowerCase();
      });

      // Target full names for the selected vehicle types
      const targetVariants = form.vehicleTypes.map(type => {
        const fullName = type === "All"
          ? form.baseName.trim()
          : `${form.baseName.trim()} - ${type}`;
        return { type, fullName };
      });

      // Check for name collisions with other services in the system
      const originalVariantIds = originalVariants.map(ov => ov.id);
      for (const target of targetVariants) {
        const duplicate = services.find(s => 
          s.name.toLowerCase() === target.fullName.toLowerCase() && 
          !originalVariantIds.includes(s.id)
        );
        if (duplicate) {
          alert(`A service named "${target.fullName}" already exists.`);
          return;
        }
      }

      const updatedNames: string[] = [];
      const createdNames: string[] = [];
      const deactivatedNames: string[] = [];
      const failedNames: string[] = [];

      // 1. Process selected vehicle types (Create new ones or update existing ones)
      for (const target of targetVariants) {
        // Find if this specific vehicle type exists in originalVariants
        const existingSvc = originalVariants.find(ov => {
          const ovm = ov.name.match(vehicleSpecificServicePattern);
          const ovType = ovm ? ovm[2].trim() : "All";
          return ovType.toLowerCase() === target.type.toLowerCase();
        });

        const payload = {
          name: target.fullName,
          description: form.description || null,
          price: priceVal,
          category: form.category,
          isActive: form.isActive, // Apply checked state from form
        };

        if (existingSvc) {
          // Update the existing service variant
          const res = await fetch(`/api/services/${existingSvc.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (data.success) {
            updatedNames.push(target.fullName);
          } else {
            failedNames.push(target.fullName);
          }
        } else {
          // Create a new service variant
          const res = await fetch("/api/services", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (data.success) {
            createdNames.push(target.fullName);
          } else {
            failedNames.push(target.fullName);
          }
        }
      }

      // 2. Process deselected vehicle types (original variants whose vehicle types are not in target types)
      const targetTypesLower = form.vehicleTypes.map(t => t.toLowerCase());
      const deselectedVariants = originalVariants.filter(ov => {
        const ovm = ov.name.match(vehicleSpecificServicePattern);
        const ovType = ovm ? ovm[2].trim() : "All";
        return !targetTypesLower.includes(ovType.toLowerCase());
      });

      for (const dv of deselectedVariants) {
        // Deactivate the deselected variant
        const res = await fetch(`/api/services/${dv.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: dv.name,
            description: dv.description,
            price: dv.price,
            category: dv.category,
            isActive: false, // Set to inactive because it was deselected
          }),
        });
        const data = await res.json();
        if (data.success) {
          deactivatedNames.push(dv.name);
        } else {
          failedNames.push(dv.name);
        }
      }

      setShowModal(false);
      fetchServices();

      let message = "Services saved successfully.";
      if (updatedNames.length > 0) message += `\nUpdated: ${updatedNames.join(", ")}`;
      if (createdNames.length > 0) message += `\nCreated: ${createdNames.join(", ")}`;
      if (deactivatedNames.length > 0) message += `\nDeactivated: ${deactivatedNames.join(", ")}`;
      if (failedNames.length > 0) message += `\nFailed to save: ${failedNames.join(", ")}`;
      alert(message);
    } else {
      // Adding new service(s) - could be multiple vehicle types selected
      // We will create them one by one, ignoring duplicates
      const createdNames: string[] = [];
      const skippedNames: string[] = [];

      for (const type of form.vehicleTypes) {
        const fullName = type === "All"
          ? form.baseName.trim()
          : `${form.baseName.trim()} - ${type}`;

        const isDuplicate = services.some(s => s.name.toLowerCase() === fullName.toLowerCase());
        if (isDuplicate) {
          skippedNames.push(fullName);
          continue;
        }

        const res = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: fullName,
            description: form.description || null,
            price: priceVal,
            category: form.category,
            isActive: form.isActive,
          }),
        });
        const data = await res.json();
        if (data.success) {
          createdNames.push(fullName);
        }
      }

      if (createdNames.length > 0) {
        setShowModal(false);
        fetchServices();
        let message = `Successfully created ${createdNames.length} service(s).`;
        if (skippedNames.length > 0) {
          message += `\nSkipped duplicates: ${skippedNames.join(", ")}`;
        }
        alert(message);
      } else if (skippedNames.length > 0) {
        alert(`No services created. All selected variants already exist: ${skippedNames.join(", ")}`);
      } else {
        alert("Error creating services.");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await fetch(`/api/services/${id}`, { method: "DELETE" });
    fetchServices();
  };

  const filteredServices = services.filter((s) => {
    const matchSearch =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCategory =
      categoryFilter === "all" || (s.category && s.category.toLowerCase() === categoryFilter.toLowerCase());
    return matchSearch && matchCategory;
  });

  return (
    <DashboardLayout title="Dynamic Pricing & Services">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>Manage Services & Dynamic Rates</span>
            <span className="text-xs font-mono font-bold bg-white/10 text-gray-300 px-2.5 py-1 rounded-full">
              {services.length} Total
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Prices configured here automatically update all customer pages, package listings, and booking calculators in real-time.
          </p>
        </div>
        <button onClick={handleNew} className="bg-red-600 hover:bg-red-700 active:scale-[0.98] transition px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-red-900/30">
          + Add New Service
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0b0b0b] border border-gray-800 p-4 rounded-2xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <input
            type="text"
            placeholder="Search service name, vehicle type, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-red-600 transition"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {["all", "Wash", "Detailing", "Spa", "Addon"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition capitalize whitespace-nowrap ${
                categoryFilter.toLowerCase() === cat.toLowerCase()
                  ? "bg-red-650 text-white shadow-md shadow-red-900/30"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {cat === "all" ? `All (${services.length})` : `${cat} (${services.filter(s => s.category?.toLowerCase() === cat.toLowerCase()).length})`}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-red-600 text-xs uppercase tracking-wider text-left text-white">
                <th className="p-3">Service Name</th>
                <th className="p-3">Vehicle Type</th>
                <th className="p-3">Category</th>
                <th className="p-3 font-mono">Price (₹)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-850">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500 font-mono">Loading Services Registry...</td></tr>
              ) : filteredServices.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No services match the specified filter.</td></tr>
              ) : filteredServices.map(svc => {
                const match = svc.name.match(/^(.+?)\s*-\s*([A-Za-z0-9\/\-\s]+)$/i);
                const displayName = match ? match[1].trim() : svc.name;
                const vehicleType = match ? match[2].trim() : "All";
                return (
                  <tr key={svc.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 font-medium text-white">
                      <div>{displayName}</div>
                      {svc.description && <div className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{svc.description}</div>}
                    </td>
                    <td className="p-3">
                      <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-xs text-gray-300 font-mono">
                        {vehicleType}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                        svc.category?.toLowerCase() === "spa" ? "bg-purple-950/40 text-purple-400 border-purple-800/40" :
                        svc.category?.toLowerCase() === "detailing" ? "bg-amber-950/40 text-amber-400 border-amber-800/40" :
                        svc.category?.toLowerCase() === "addon" ? "bg-cyan-950/40 text-cyan-400 border-cyan-850" :
                        "bg-emerald-950/40 text-emerald-400 border-emerald-850"
                      }`}>
                        {svc.category || "Wash"}
                      </span>
                    </td>
                    <td className="p-3 font-bold font-mono text-green-400">₹{svc.price.toLocaleString()}</td>
                    <td className="p-3">
                      {svc.isActive ? (
                        <span className="text-green-400 font-bold text-xs bg-green-950/40 border border-green-800/40 px-2.5 py-0.5 rounded-full">Active</span>
                      ) : (
                        <span className="text-red-400 font-bold text-xs bg-red-950/40 border border-red-800/40 px-2.5 py-0.5 rounded-full">Inactive</span>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button onClick={() => handleEdit(svc)} className="text-cyan-400 font-bold hover:underline text-xs">Edit</button>
                      <button onClick={() => handleDelete(svc.id)} className="text-red-400 font-bold hover:underline text-xs">Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit' : 'Add'} Service</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Service Name *</label>
                <input
                  placeholder="e.g. Classic Wash"
                  value={form.baseName}
                  onChange={e => setForm({...form, baseName: e.target.value})}
                  className="w-full bg-black border border-zinc-700 p-3 rounded text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Vehicle Type(s) *</label>
                <div className="grid grid-cols-2 gap-2 bg-black border border-zinc-700 p-3 rounded max-h-40 overflow-y-auto">
                  {BASE_VEHICLE_OPTIONS.map(opt => {
                    const isChecked = form.vehicleTypes.includes(opt.value);
                    return (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 hover:text-white select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (opt.value === "All") {
                              setForm({ ...form, vehicleTypes: ["All"] });
                            } else {
                              let nextTypes = form.vehicleTypes.filter(v => v !== "All");
                              if (isChecked) {
                                nextTypes = nextTypes.filter(v => v !== opt.value);
                              } else {
                                nextTypes.push(opt.value);
                              }
                              if (nextTypes.length === 0) {
                                nextTypes = ["All"];
                              }
                              setForm({ ...form, vehicleTypes: nextTypes });
                            }
                          }}
                          className="w-4 h-4 accent-red-600 rounded"
                        />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Category *</label>
                <select
                  value={form.category}
                  onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full bg-black border border-zinc-700 p-3 rounded text-white text-sm focus:outline-none focus:border-red-500"
                >
                  <option value="Wash">Wash</option>
                  <option value="Detailing">Detailing</option>
                  <option value="Spa">Spa</option>
                  <option value="Addon">Addon</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Description</label>
                <textarea
                  placeholder="Enter details..."
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full bg-black border border-zinc-700 p-3 rounded h-20 text-white text-sm focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Price (Rs.) *</label>
                <input
                  type="number"
                  placeholder="Price"
                  value={form.price}
                  onChange={e => setForm({...form, price: e.target.value})}
                  className="w-full bg-black border border-zinc-700 p-3 rounded text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm({...form, isActive: e.target.checked})}
                  className="w-5 h-5 accent-red-600"
                />
                Active and visible to customers
              </label>

              <div className="flex gap-2 pt-4">
                <button onClick={() => setShowModal(false)} className="flex-1 bg-zinc-800 p-3 rounded text-sm font-semibold hover:bg-zinc-750 transition">Cancel</button>
                <button onClick={handleSave} className="flex-1 bg-red-600 p-3 rounded font-bold text-sm hover:bg-red-500 transition">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}