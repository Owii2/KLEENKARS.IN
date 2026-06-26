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

  return (
    <DashboardLayout title="Dynamic Pricing & Services">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Manage Services</h2>
        <button onClick={handleNew} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-bold">
          + Add New Service
        </button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-red-600">
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Vehicle Type</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Price (Rs.)</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-4">Loading...</td></tr>
              ) : services.map(svc => {
                const match = svc.name.match(/^(.+?)\s*-\s*([A-Za-z0-9\/\-\s]+)$/i);
                const displayName = match ? match[1].trim() : svc.name;
                const vehicleType = match ? match[2].trim() : "All";
                return (
                  <tr key={svc.id} className="border-b border-gray-800">
                    <td className="p-3 font-medium">{displayName}</td>
                    <td className="p-3">
                      <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-xs text-gray-300">
                        {vehicleType}
                      </span>
                    </td>
                    <td className="p-3">{svc.category || "-"}</td>
                    <td className="p-3 font-bold text-green-400">{svc.price}</td>
                    <td className="p-3">
                      {svc.isActive ? (
                        <span className="text-green-500 font-bold text-xs bg-green-500/20 px-2 py-1 rounded-full">Active</span>
                      ) : (
                        <span className="text-red-500 font-bold text-xs bg-red-500/20 px-2 py-1 rounded-full">Inactive</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => handleEdit(svc)} className="text-blue-400 mr-4 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(svc.id)} className="text-red-500 hover:underline">Delete</button>
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
                  <option value="Addon">Addon</option>
                  <option value="Detailing">Detailing</option>
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