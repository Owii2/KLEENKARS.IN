"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Card from "@/components/ui/Card";

interface Offer {
  id: string;
  title: string;
  description: string | null;
  discountPercent: number;
  discountAmount: number;
  validDays: string[];
  startTime: string | null;
  endTime: string | null;
  applicableServiceIds: string[];
  minVehicles: number;
  discountSecondVehicleAmount: number;
  code: string | null;
  isActive: boolean;
  validUntil: string | null;
  imageUrl: string | null;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    discountPercent: "",
    discountAmount: "",
    validDays: [] as string[],
    startTime: "",
    endTime: "",
    applicableServiceIds: [] as string[],
    minVehicles: "1",
    discountSecondVehicleAmount: "0",
    code: "",
    validUntil: "",
    isActive: true,
    imageUrl: "",
  });

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const fetchOffers = async () => {
    setLoading(true);
    const [resOffers, resServices] = await Promise.all([
      fetch("/api/offers"),
      fetch("/api/services")
    ]);
    const dataOffers = await resOffers.json();
    const dataServices = await resServices.json();
    
    if (dataOffers.success) setOffers(dataOffers.offers);
    if (dataServices.success) setServices(dataServices.services);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleEdit = (offer: Offer) => {
    setEditingId(offer.id);
    setForm({
      title: offer.title,
      description: offer.description || "",
      discountPercent: offer.discountPercent.toString(),
      discountAmount: offer.discountAmount.toString(),
      validDays: offer.validDays || [],
      startTime: offer.startTime || "",
      endTime: offer.endTime || "",
      applicableServiceIds: offer.applicableServiceIds || [],
      minVehicles: offer.minVehicles.toString(),
      discountSecondVehicleAmount: offer.discountSecondVehicleAmount.toString(),
      code: offer.code || "",
      validUntil: offer.validUntil ? new Date(offer.validUntil).toISOString().split('T')[0] : "",
      isActive: offer.isActive,
      imageUrl: offer.imageUrl || "",
    });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingId(null);
    setForm({ 
      title: "", 
      description: "", 
      discountPercent: "", 
      discountAmount: "", 
      validDays: [], 
      startTime: "", 
      endTime: "", 
      applicableServiceIds: [], 
      minVehicles: "1", 
      discountSecondVehicleAmount: "0", 
      code: "", 
      validUntil: "", 
      isActive: true, 
      imageUrl: "" 
    });
    setShowModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const url = editingId ? `/api/offers/${editingId}` : "/api/offers";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        discountPercent: parseInt(form.discountPercent) || 0,
        discountAmount: parseInt(form.discountAmount) || 0,
        minVehicles: parseInt(form.minVehicles) || 1,
        discountSecondVehicleAmount: parseInt(form.discountSecondVehicleAmount) || 0,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setShowModal(false);
      fetchOffers();
    } else {
      alert("Error saving offer");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await fetch(`/api/offers/${id}`, { method: "DELETE" });
    fetchOffers();
  };

  return (
    <DashboardLayout title="Dynamic Offers & Discounts">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Manage Offers</h2>
        <button onClick={handleNew} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-bold">
          + Create Offer
        </button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-red-600">
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Discount</th>
                <th className="p-3 text-left">Promo Code</th>
                <th className="p-3 text-left">Valid Until</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-4">Loading...</td></tr>
              ) : offers.map(offer => (
                <tr key={offer.id} className="border-b border-gray-800">
                  <td className="p-3 font-medium">
                    {offer.title}
                    {offer.imageUrl && <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Poster attached</span>}
                  </td>
                  <td className="p-3 font-bold text-yellow-400">
                    {offer.discountPercent > 0 ? `${offer.discountPercent}% OFF` : `Rs.${offer.discountAmount} OFF`}
                  </td>
                  <td className="p-3"><span className="bg-zinc-800 px-2 py-1 rounded tracking-widest text-sm">{offer.code || "AUTO"}</span></td>
                  <td className="p-3 text-gray-400">
                    {offer.validUntil ? new Date(offer.validUntil).toLocaleDateString() : "No Expiry"}
                  </td>
                  <td className="p-3">
                    {offer.isActive ? (
                      <span className="text-green-500 font-bold text-xs bg-green-500/20 px-2 py-1 rounded-full">Active</span>
                    ) : (
                      <span className="text-red-500 font-bold text-xs bg-red-500/20 px-2 py-1 rounded-full">Inactive</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => handleEdit(offer)} className="text-blue-400 mr-4 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(offer.id)} className="text-red-500 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl w-full max-w-2xl my-8">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit' : 'Create'} Offer</h2>
            <div className="space-y-4">
              <input placeholder="Offer Title (e.g. Diwali Special)" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded" />
              <textarea placeholder="Offer Description (Optional)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded" />
              
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Discount Percentage (e.g. 50)" value={form.discountPercent} onChange={e => setForm({...form, discountPercent: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded" />
                <input type="number" placeholder="OR Flat Discount Amount (e.g. 100)" value={form.discountAmount} onChange={e => setForm({...form, discountAmount: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded" />
              </div>

              <div>
                <label className="text-sm font-bold block mb-2">Valid Days</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <label key={day} className="flex items-center gap-1 bg-black border border-zinc-700 p-2 rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={form.validDays.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) setForm({...form, validDays: [...form.validDays, day]});
                          else setForm({...form, validDays: form.validDays.filter(d => d !== day)});
                        }}
                      /> {day}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Start Time (e.g. 10:00)</label>
                  <input type="time" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">End Time (e.g. 15:00)</label>
                  <input type="time" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded" />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold block mb-2">Applicable Services (Leave empty for ALL services)</label>
                <div className="grid grid-cols-2 max-h-40 overflow-y-auto bg-black p-2 rounded border border-zinc-700 gap-2">
                  {services.map(svc => (
                    <label key={svc.id} className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox" 
                        checked={form.applicableServiceIds.includes(svc.id)}
                        onChange={(e) => {
                          if (e.target.checked) setForm({...form, applicableServiceIds: [...form.applicableServiceIds, svc.id]});
                          else setForm({...form, applicableServiceIds: form.applicableServiceIds.filter(id => id !== svc.id)});
                        }}
                      /> {svc.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 space-y-3">
                <h3 className="font-bold text-sm">Multi-Vehicle Rule (e.g. Bring a friend)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Min Vehicles Required</label>
                    <input type="number" min="1" value={form.minVehicles} onChange={e => setForm({...form, minVehicles: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Discount for 2nd Vehicle (Rs.)</label>
                    <input type="number" value={form.discountSecondVehicleAmount} onChange={e => setForm({...form, discountSecondVehicleAmount: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Promo Code (Optional)" value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded" />
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Valid Until (Optional)</label>
                  <input type="date" value={form.validUntil} onChange={e => setForm({...form, validUntil: e.target.value})} className="w-full bg-black border border-zinc-700 p-3 rounded" />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold block mb-2">Upload Offer Poster (Shows in Homepage Pop-up)</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full bg-black border border-zinc-700 p-3 rounded" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {form.imageUrl && <img src={form.imageUrl} alt="Offer Preview" className="mt-2 h-32 rounded object-contain bg-black" />}
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="w-5 h-5 accent-red-600" />
                Active and redeemable
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
