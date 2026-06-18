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

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
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
    setForm({
      name: svc.name,
      description: svc.description || "",
      price: svc.price.toString(),
      category: svc.category || "",
      isActive: svc.isActive,
    });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingId(null);
    setForm({ name: "", description: "", price: "", category: "", isActive: true });
    setShowModal(true);
  };

  const handleSave = async () => {
    const url = editingId ? `/api/services/${editingId}` : "/api/services";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        price: parseInt(form.price) || 0,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setShowModal(false);
      fetchServices();
    } else {
      alert("Error saving service");
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
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Price (Rs.)</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-4">Loading...</td></tr>
              ) : services.map(svc => (
                <tr key={svc.id} className="border-b border-gray-800">
                  <td className="p-3 font-medium">{svc.name}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit' : 'Add'} Service</h2>
            <div className="space-y-4">
              <input placeholder="Service Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded" />
              <input placeholder="Category (e.g. Wash, Detailing)" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded" />
              <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded h-24" />
              <input type="number" placeholder="Price (Rs.)" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded" />
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="w-5 h-5 accent-red-600" />
                Active and visible to customers
              </label>

              <div className="flex gap-2 pt-4">
                <button onClick={() => setShowModal(false)} className="flex-1 bg-zinc-800 p-3 rounded">Cancel</button>
                <button onClick={handleSave} className="flex-1 bg-red-600 p-3 rounded font-bold">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}