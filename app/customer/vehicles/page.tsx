"use client";

import { FormEvent, useEffect, useState } from "react";

interface CustomerUser {
  phone: string;
}

interface Vehicle {
  id: string;
  number: string;
  model: string;
  fuel: string;
  color: string;
}

export default function VehiclesPage() {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState({ number: "", model: "", fuel: "", color: "" });

  useEffect(() => {
    const storedUser = window.localStorage.getItem("customerUser");
    const parsedUser = storedUser ? (JSON.parse(storedUser) as CustomerUser) : null;
    setUser(parsedUser);

    if (parsedUser) {
      setVehicles(
        JSON.parse(window.localStorage.getItem(`vehicles_${parsedUser.phone}`) || "[]") as Vehicle[]
      );
    }
  }, []);

  const save = (event: FormEvent) => {
    event.preventDefault();

    if (!user || !form.number) return;

    const next = [
      ...vehicles,
      {
        ...form,
        id: `${form.number}-${vehicles.length + 1}`,
      },
    ];

    setVehicles(next);
    window.localStorage.setItem(`vehicles_${user.phone}`, JSON.stringify(next));
    setForm({ number: "", model: "", fuel: "", color: "" });
  };

  if (!user) {
    return <div className="p-6">Please log in to manage vehicles.</div>;
  }

  return (
    <main className="min-h-screen p-6 bg-black text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Your Vehicles</h1>
        <form onSubmit={save} className="p-4 bg-zinc-900 rounded space-y-3">
          <input
            value={form.number}
            onChange={(e) => setForm({ ...form, number: e.target.value.toUpperCase() })}
            placeholder="Car Number"
            className="w-full p-3 rounded bg-zinc-800"
          />
          <input
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            placeholder="Model"
            className="w-full p-3 rounded bg-zinc-800"
          />
          <input
            value={form.fuel}
            onChange={(e) => setForm({ ...form, fuel: e.target.value })}
            placeholder="Fuel Type"
            className="w-full p-3 rounded bg-zinc-800"
          />
          <input
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            placeholder="Color"
            className="w-full p-3 rounded bg-zinc-800"
          />
          <button className="px-4 py-2 bg-red-500 rounded">Add Vehicle</button>
        </form>

        <div className="space-y-3">
          {vehicles.length === 0 ? (
            <div className="p-3 bg-zinc-900 rounded text-gray-400">No vehicles saved.</div>
          ) : (
            vehicles.map((vehicle) => (
              <div key={vehicle.id} className="p-3 bg-zinc-900 rounded">
                <div className="font-bold">{vehicle.number}</div>
                <div className="text-sm text-gray-400">
                  {vehicle.model} - {vehicle.fuel} - {vehicle.color}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
