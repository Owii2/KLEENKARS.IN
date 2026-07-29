"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface VehicleTier {
  id: string;
  name: string;
  example: string;
  multiplier: number;
}

interface Treatment {
  id: string;
  name: string;
  description: string;
  basePrice: number; // Hatchback base
}

interface Addon {
  id: string;
  name: string;
  price: number;
}

interface ApiService {
  id: string;
  name: string;
  price: number;
  category: string | null;
  isActive: boolean;
}

const VEHICLE_TIERS: VehicleTier[] = [
  { id: "hatchback", name: "Hatchback / Compact", example: "Swift, Baleno, i20, Tiago", multiplier: 1.0 },
  { id: "sedan", name: "Sedan / Executive", example: "City, Verna, Ciaz, Slavia", multiplier: 1.25 },
  { id: "suv", name: "SUV / MUV", example: "Creta, Seltos, Thar, Fortuner, Innova", multiplier: 1.45 },
  { id: "luxury", name: "Luxury / Super SUV", example: "BMW 3/5, Audi Q5, Mercedes C/E", multiplier: 1.75 },
];

const DEFAULT_TREATMENTS: Treatment[] = [
  {
    id: "wash",
    name: "Premium Foam Wash & Vacuum",
    description: "pH-neutral foam bath, high-pressure rinse, rim clean & interior vacuum.",
    basePrice: 399,
  },
  {
    id: "interior",
    name: "Interior Deep Clean & Steam Spa",
    description: "140°C steam extraction, leather conditioning & AC duct sanitization.",
    basePrice: 1499,
  },
  {
    id: "correction",
    name: "Dual-Action Paint Correction",
    description: "Multi-stage machine polishing removing 85%+ swirl marks & oxidation.",
    basePrice: 2999,
  },
  {
    id: "ceramic",
    name: "9H Nano Ceramic Coating",
    description: "Glassy hydrophobic paint shield with 3-year multi-layer protection.",
    basePrice: 8999,
  },
  {
    id: "ppf",
    name: "TPU Paint Protection Film (PPF)",
    description: "Self-healing clear film protecting paint from stone chips & scratches.",
    basePrice: 45000,
  },
];

const DEFAULT_ADDONS: Addon[] = [
  { id: "headlight", name: "Headlight UV Restoration", price: 499 },
  { id: "engine", name: "Engine Bay Detailing & Dressing", price: 399 },
  { id: "windshield", name: "Windshield Hydrophobic Coating", price: 799 },
];

export function PriceEstimator() {
  const [selectedVehicle, setSelectedVehicle] = useState<string>("hatchback");
  const [selectedTreatment, setSelectedTreatment] = useState<string>("wash");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>(DEFAULT_TREATMENTS);
  const [addons, setAddons] = useState<Addon[]>(DEFAULT_ADDONS);

  // Sync pricing dynamically with admin-managed database services
  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.services)) {
          const dbServices: ApiService[] = data.services.filter((s: ApiService) => s.isActive);

          setTreatments((prev) =>
            prev.map((t) => {
              const match = dbServices.find((s) => {
                const n = s.name.toLowerCase();
                if (t.id === "wash") return n.includes("wash") || n.includes("foam");
                if (t.id === "interior") return n.includes("interior") || n.includes("cabin");
                if (t.id === "correction") return n.includes("correction") || n.includes("restoration") || n.includes("polish");
                if (t.id === "ceramic") return n.includes("ceramic") || n.includes("coating");
                if (t.id === "ppf") return n.includes("ppf") || n.includes("film");
                return false;
              });
              return match ? { ...t, basePrice: match.price } : t;
            })
          );

          setAddons((prev) =>
            prev.map((a) => {
              const match = dbServices.find((s) => {
                const n = s.name.toLowerCase();
                if (a.id === "headlight") return n.includes("headlight");
                if (a.id === "engine") return n.includes("engine");
                if (a.id === "windshield") return n.includes("windshield") || n.includes("rain");
                return s.category === "Addon" && n.includes(a.name.toLowerCase());
              });
              return match ? { ...a, price: match.price } : a;
            })
          );
        }
      })
      .catch(console.error);
  }, []);

  const currentTier = VEHICLE_TIERS.find((v) => v.id === selectedVehicle) || VEHICLE_TIERS[0];
  const currentTreatment = treatments.find((t) => t.id === selectedTreatment) || treatments[0];

  const calculatedPackagePrice = Math.round(currentTreatment.basePrice * currentTier.multiplier);
  const addonsTotalPrice = selectedAddons.reduce((acc, addonId) => {
    const addonObj = addons.find((a) => a.id === addonId);
    return acc + (addonObj ? addonObj.price : 0);
  }, 0);

  const totalEstimatedPrice = calculatedPackagePrice + addonsTotalPrice;

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const bookingUrl = `/booking?vehicle=${selectedVehicle}&service=${selectedTreatment}&addons=${selectedAddons.join(",")}`;

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-10 space-y-8 shadow-2xl">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-[0.35em] text-red-500 bg-red-950/40 border border-red-500/20 px-3 py-1 rounded-full">
          Instant Price Calculator
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
          Estimate Your Car Detailing Cost
        </h2>
        <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
          Select your vehicle size, preferred detailing treatment, and optional care add-ons to generate an instant estimate.
        </p>
      </div>

      {/* STEP 1: VEHICLE SIZE SELECTOR */}
      <div className="space-y-4">
        <label className="text-xs uppercase font-bold tracking-wider text-gray-400 block">
          Step 1: Select Your Vehicle Type
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {VEHICLE_TIERS.map((tier) => (
            <button
              key={tier.id}
              onClick={() => setSelectedVehicle(tier.id)}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[90px] ${
                selectedVehicle === tier.id
                  ? "bg-red-950/40 border-red-500 text-white shadow-lg shadow-red-500/10"
                  : "bg-zinc-900/60 border-zinc-800 text-gray-400 hover:border-zinc-700 hover:text-white"
              }`}
            >
              <div>
                <div className="text-sm font-bold text-white">{tier.name}</div>
                <div className="text-[11px] text-gray-400 mt-1 line-clamp-1">{tier.example}</div>
              </div>
              <span className={`text-[10px] font-semibold uppercase mt-2 ${selectedVehicle === tier.id ? "text-red-400" : "text-gray-500"}`}>
                {selectedVehicle === tier.id ? "✓ Selected" : "Select"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 2: SERVICE TREATMENT SELECTOR */}
      <div className="space-y-4">
        <label className="text-xs uppercase font-bold tracking-wider text-gray-400 block">
          Step 2: Choose Detailing Treatment
        </label>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {treatments.map((treatment) => {
            const priceForTier = Math.round(treatment.basePrice * currentTier.multiplier);
            const isSelected = selectedTreatment === treatment.id;
            return (
              <button
                key={treatment.id}
                onClick={() => setSelectedTreatment(treatment.id)}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-red-950/40 border-red-500 text-white shadow-lg shadow-red-500/10"
                    : "bg-zinc-900/60 border-zinc-800 text-gray-400 hover:border-zinc-700 hover:text-white"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{treatment.name}</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{treatment.description}</p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-800/60">
                  <span className="text-base font-black text-red-500">₹{priceForTier}</span>
                  <span className={`text-[10px] font-semibold uppercase ${isSelected ? "text-red-400" : "text-gray-500"}`}>
                    {isSelected ? "✓ Selected" : "Select"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 3: OPTIONAL ADDONS */}
      <div className="space-y-4">
        <label className="text-xs uppercase font-bold tracking-wider text-gray-400 block">
          Step 3: Optional Care Add-ons
        </label>
        <div className="grid sm:grid-cols-3 gap-3">
          {addons.map((addon) => {
            const isChecked = selectedAddons.includes(addon.id);
            return (
              <button
                key={addon.id}
                onClick={() => toggleAddon(addon.id)}
                className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition ${
                  isChecked
                    ? "bg-zinc-800 border-red-500/60 text-white"
                    : "bg-zinc-900/40 border-zinc-800 text-gray-400 hover:border-zinc-700"
                }`}
              >
                <div>
                  <div className="text-xs font-semibold text-white">{addon.name}</div>
                  <div className="text-xs font-bold text-red-400 mt-0.5">+₹{addon.price}</div>
                </div>
                <span className={`text-base ${isChecked ? "text-red-500 font-bold" : "text-gray-600"}`}>
                  {isChecked ? "☑" : "☐"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TOTAL COST & ACTION BANNER */}
      <div className="bg-gradient-to-r from-red-950/60 via-zinc-900 to-black border border-red-500/40 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
            Estimated Total for {currentTier.name}
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white flex items-center justify-center sm:justify-start gap-2">
            <span className="text-red-500">₹{totalEstimatedPrice}</span>
            <span className="text-xs font-normal text-gray-400">(Incl. Doorstep Pickup option)</span>
          </div>
        </div>

        <Link
          href={bookingUrl}
          className="w-full sm:w-auto text-center bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest py-4 px-8 rounded-xl transition shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 min-h-[48px]"
        >
          <span>Book Estimated Package</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
