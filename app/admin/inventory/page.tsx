"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minStock: number;
  costPerUnit: number;
  updatedAt: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Forecasting state
  const [activeTab, setActiveTab] = useState<"registry" | "forecasting">("registry");
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [forecastMeta, setForecastMeta] = useState<any>({
    totalBookings: 0,
    pastBaselineBookings: 0,
    futureScheduledBookings: 0
  });
  const [forecastLoading, setForecastLoading] = useState(false);

  // Edit/Add modals state
  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("Liters");
  const [minStock, setMinStock] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/inventory");
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchForecasts = async () => {
    try {
      setForecastLoading(true);
      const res = await fetch("/api/admin/inventory/forecast");
      const data = await res.json();
      if (data.success) {
        setForecasts(data.forecasts || []);
        setForecastMeta(data.meta || {
          totalBookings: 0,
          pastBaselineBookings: 0,
          futureScheduledBookings: 0
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setForecastLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "forecasting") {
      fetchForecasts();
    } else {
      fetchInventory();
    }
  }, [activeTab]);

  const handleEditClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setName(item.name);
    setQuantity(String(item.quantity));
    setUnit(item.unit);
    setMinStock(String(item.minStock));
    setCostPerUnit(String(item.costPerUnit));
    setShowForm(true);
  };

  const handleAddClick = () => {
    setSelectedItem(null);
    setName("");
    setQuantity("");
    setUnit("Liters");
    setMinStock("5");
    setCostPerUnit("");
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inventory item?")) return;

    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        if (activeTab === "forecasting") {
          fetchForecasts();
        } else {
          fetchInventory();
        }
      } else {
        alert(data.message || "Failed to delete item");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (!name || quantity === undefined || !unit || costPerUnit === undefined) {
      alert("Please fill all required fields.");
      return;
    }

    const payload = {
      name,
      quantity: Number(quantity),
      unit,
      minStock: Number(minStock || 5),
      costPerUnit: Number(costPerUnit),
    };

    try {
      const url = selectedItem ? `/api/inventory/${selectedItem.id}` : "/api/inventory";
      const method = selectedItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(selectedItem ? "Item updated successfully!" : "Product added successfully!");
        setShowForm(false);
        if (activeTab === "forecasting") {
          fetchForecasts();
        } else {
          fetchInventory();
        }
      } else {
        alert(data.message || "Operation failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving item.");
    }
  };

  return (
    <DashboardLayout title="Inventory & Stock Registry">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-red-500">
            Inventory Registry
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Manage your store cleaning chemicals, tools, wax supply, and monitor threshold stocks.
          </p>
        </div>
        <button
          onClick={handleAddClick}
          className="bg-red-600 hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-white font-semibold px-5 py-3 rounded-lg flex items-center gap-2 self-start md:self-auto shadow-lg shadow-red-900/30"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-gray-800 mb-6 gap-2">
        <button
          onClick={() => setActiveTab("registry")}
          className={`px-4 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "registry"
              ? "border-red-500 text-white"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          📁 Stock Registry
        </button>
        <button
          onClick={() => setActiveTab("forecasting")}
          className={`px-4 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "forecasting"
              ? "border-red-500 text-white"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          📈 Supply Chain Forecasting
        </button>
      </div>

      {activeTab === "forecasting" ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0b0b0b] p-5 rounded-xl border border-gray-800">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Items Monitored</span>
              <span className="text-3xl font-extrabold text-white mt-1 block">{forecasts.length}</span>
            </div>
            
            <div className="bg-[#0b0b0b] p-5 rounded-xl border border-gray-800">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Critical Depletion (3 Days)</span>
              <span className={`text-3xl font-extrabold mt-1 block ${
                forecasts.filter(f => f.status === "CRITICAL").length > 0 ? "text-red-500" : "text-white"
              }`}>
                {forecasts.filter(f => f.status === "CRITICAL").length}
              </span>
            </div>
            
            <div className="bg-[#0b0b0b] p-5 rounded-xl border border-gray-800">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Low Stock Warnings</span>
              <span className={`text-3xl font-extrabold mt-1 block ${
                forecasts.filter(f => f.status === "WARNING").length > 0 ? "text-amber-500" : "text-white"
              }`}>
                {forecasts.filter(f => f.status === "WARNING").length}
              </span>
            </div>
            
            <div className="bg-[#0b0b0b] p-5 rounded-xl border border-gray-800">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Scheduled Bookings (14d)</span>
              <span className="text-3xl font-extrabold text-green-400 mt-1 block">
                {forecastMeta.futureScheduledBookings}
              </span>
            </div>
          </div>

          {/* Forecasting Table */}
          <div className="bg-[#0b0b0b] rounded-xl border border-gray-800 overflow-hidden">
            {forecastLoading ? (
              <div className="py-20 text-center text-gray-500">
                Generating run-out estimates...
              </div>
            ) : forecasts.length === 0 ? (
              <div className="py-16 text-center text-gray-500 text-sm">
                No forecasts available. Add inventory items and bookings to calculate forecasts.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#141414] text-gray-400 font-semibold uppercase tracking-wider text-xs border-b border-gray-800">
                    <tr>
                      <th className="px-6 py-4">Item Name</th>
                      <th className="px-6 py-4">Current Stock</th>
                      <th className="px-6 py-4">Daily Usage Rate</th>
                      <th className="px-6 py-4">Est. Days Left</th>
                      <th className="px-6 py-4">Reorder Date</th>
                      <th className="px-6 py-4">Supply Health</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-850">
                    {forecasts.map((item) => {
                      const daysLeft = item.daysLeft;
                      const isInf = daysLeft === "Infinity" || daysLeft === Infinity;

                      return (
                        <tr key={item.id} className="hover:bg-[#121212]/40 transition-colors">
                          <td className="px-6 py-4 font-semibold text-white">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-white">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-6 py-4 font-mono text-gray-300">
                            {item.dailyUsageRate} {item.unit}/day
                          </td>
                          <td className={`px-6 py-4 font-mono font-bold ${
                            item.status === "CRITICAL" ? "text-red-400" :
                            item.status === "WARNING" ? "text-amber-400" : "text-green-400"
                          }`}>
                            {isInf ? "Stable (No usage)" : `${daysLeft} days`}
                          </td>
                          <td className="px-6 py-4 font-mono text-gray-300">
                            {item.suggestedReorderDate}
                          </td>
                          <td className="px-6 py-4">
                            {item.status === "CRITICAL" ? (
                              <span className="bg-red-955/40 text-red-400 border border-red-800/40 text-xs px-2.5 py-1 rounded-full font-bold uppercase">
                                🚨 CRITICAL RUN-OUT
                              </span>
                            ) : item.status === "WARNING" ? (
                              <span className="bg-amber-955/40 text-amber-400 border border-amber-800/40 text-xs px-2.5 py-1 rounded-full font-bold uppercase">
                                ⚠️ REORDER SUGGESTED
                              </span>
                            ) : (
                              <span className="bg-green-955/40 text-green-400 border border-green-800/40 text-xs px-2.5 py-1 rounded-full font-bold uppercase">
                                ✅ Healthy Stock
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="text-red-500 hover:text-red-400 font-semibold text-xs bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md transition"
                            >
                              Restock Product
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
      ) : (
        /* Grid of Stock list */
        <div className="bg-[#0b0b0b] rounded-xl border border-gray-800 overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-gray-500">
              Fetching product catalog...
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              No inventory items registered yet. Click "Add Product" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#141414] text-gray-400 font-semibold uppercase tracking-wider text-xs border-b border-gray-800">
                  <tr>
                    <th className="px-6 py-4">Item Name</th>
                    <th className="px-6 py-4">Stock Level</th>
                    <th className="px-6 py-4">Unit</th>
                    <th className="px-6 py-4">Threshold Alert</th>
                    <th className="px-6 py-4">Cost/Unit</th>
                    <th className="px-6 py-4">Total Asset Value</th>
                    <th className="px-6 py-4">Last Updated</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850">
                  {items.map((item) => {
                    const isLow = item.quantity < item.minStock;

                    return (
                      <tr key={item.id} className="hover:bg-[#121212]/40 transition-colors">
                        <td className="px-6 py-4 font-semibold text-white">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold">
                          <span className={isLow ? "text-red-400" : "text-white"}>
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {item.unit}
                        </td>
                        <td className="px-6 py-4">
                          {isLow ? (
                            <span className="bg-red-955/40 text-red-400 border border-red-800/40 text-xs px-2.5 py-1 rounded-full font-bold">
                              ⚠️ REORDER REQ (Min: {item.minStock})
                            </span>
                          ) : (
                            <span className="bg-green-955/40 text-green-400 border border-green-800/40 text-xs px-2.5 py-1 rounded-full font-bold">
                              Stable (Min: {item.minStock})
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-300 font-mono">
                          ₹{item.costPerUnit}
                        </td>
                        <td className="px-6 py-4 text-green-400 font-bold font-mono">
                          ₹{(item.quantity * item.costPerUnit).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          {new Date(item.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="text-blue-400 hover:text-blue-300 font-semibold text-xs bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-md transition"
                          >
                            Adjust
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-500 hover:text-red-400 font-semibold text-xs bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md transition"
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
      )}

      {/* Add / Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-gray-900 border border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl glass-panel relative text-left">
            <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
              {selectedItem ? "Adjust Stock Details" : "Register New Product"}
            </h3>
            <p className="text-xs text-gray-400 mb-4">Set item name, quantities, metric units, reorder levels, and unit values.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Car Shampoo, Wax paste"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Quantity *</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Measurement Unit *</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 transition"
                  >
                    <option value="Liters">Liters</option>
                    <option value="Pieces">Pieces</option>
                    <option value="Boxes">Boxes</option>
                    <option value="Kilograms">Kilograms</option>
                    <option value="Bottles">Bottles</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Reorder Level *</label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    placeholder="Alert below this..."
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Cost / Unit (Rs.) *</label>
                  <input
                    type="number"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.value)}
                    placeholder="Unit asset cost"
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 transition"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 border-t border-white/5 pt-4">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl font-bold transition active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white py-3 rounded-xl font-bold transition active:scale-95 shadow-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
