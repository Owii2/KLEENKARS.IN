"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface VehicleTier {
  id: string;
  name: string;
  example: string;
  variantKeywords: string[]; // ["hatchback"], ["sedan"], ["suv", "muv"], ["luxury", "suv"]
}

interface Treatment {
  id: string;
  name: string;
  description: string;
  searchKeywords: string[];
  defaultPrices: Record<string, number>; // fallback per vehicle tier
}

interface Addon {
  id: string;
  name: string;
  searchKeywords: string[];
  defaultPrice: number;
}

interface ApiService {
  id: string;
  name: string;
  price: number;
  category: string | null;
  isActive: boolean;
}

const VEHICLE_TIERS: VehicleTier[] = [
  { id: "hatchback", name: "Hatchback / Compact", example: "Swift, Baleno, i20, Tiago", variantKeywords: ["hatchback", "compact"] },
  { id: "sedan", name: "Sedan / Executive", example: "City, Verna, Ciaz, Slavia", variantKeywords: ["sedan"] },
  { id: "suv", name: "SUV / MUV", example: "Creta, Seltos, Thar, Fortuner, Innova", variantKeywords: ["suv", "muv"] },
  { id: "luxury", name: "Luxury / Super SUV", example: "BMW 3/5, Audi Q5, Mercedes C/E", variantKeywords: ["luxury", "suv"] },
];

const TREATMENTS: Treatment[] = [
  {
    id: "wash",
    name: "Premium Foam Wash & Vacuum",
    description: "pH-neutral foam bath, high-pressure rinse, rim clean & interior vacuum.",
    searchKeywords: ["premium wash", "foam wash", "wash"],
    defaultPrices: { hatchback: 299, sedan: 349, suv: 399, luxury: 499 },
  },
  {
    id: "interior",
    name: "Interior Deep Clean & Steam Spa",
    description: "140°C steam extraction, leather conditioning & AC duct sanitization.",
    searchKeywords: ["interior deep clean", "cabin revive", "interior"],
    defaultPrices: { hatchback: 1299, sedan: 1299, suv: 1499, luxury: 1799 },
  },
  {
    id: "correction",
    name: "Dual-Action Paint Correction",
    description: "Multi-stage machine polishing removing 85%+ swirl marks & oxidation.",
    searchKeywords: ["paint correction", "paint restoration", "polishing"],
    defaultPrices: { hatchback: 1499, sedan: 1499, suv: 1799, luxury: 2199 },
  },
  {
    id: "ceramic",
    name: "9H Nano Ceramic Coating",
    description: "Glassy hydrophobic paint shield with 3-year multi-layer protection.",
    searchKeywords: ["ceramic coating", "ceramic", "nano coating"],
    defaultPrices: { hatchback: 5999, sedan: 7499, suv: 8999, luxury: 10999 },
  },
  {
    id: "ppf",
    name: "TPU Paint Protection Film (PPF)",
    description: "Self-healing clear film protecting paint from stone chips & scratches.",
    searchKeywords: ["ppf protection", "ppf", "paint protection film"],
    defaultPrices: { hatchback: 35000, sedan: 40000, suv: 45000, luxury: 55000 },
  },
];

const ADDONS: Addon[] = [
  { id: "headlight", name: "Headlight UV Restoration", searchKeywords: ["headlight"], defaultPrice: 499 },
  { id: "engine", name: "Engine Bay Detailing & Dressing", searchKeywords: ["engine"], defaultPrice: 399 },
  { id: "windshield", name: "Windshield Hydrophobic Coating", searchKeywords: ["windshield", "rain"], defaultPrice: 799 },
];

export function PriceEstimator() {
  const [selectedVehicle, setSelectedVehicle] = useState<string>("hatchback");
  const [selectedTreatment, setSelectedTreatment] = useState<string>("wash");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [dbServices, setDbServices] = useState<ApiService[]>([]);

  // Fetch real-time active services from database
  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.services)) {
          setDbServices(data.services.filter((s: ApiService) => s.isActive));
        }
      })
      .catch(console.error);
  }, []);

  const currentTier = VEHICLE_TIERS.find((v) => v.id === selectedVehicle) || VEHICLE_TIERS[0];
  const currentTreatmentObj = TREATMENTS.find((t) => t.id === selectedTreatment) || TREATMENTS[0];

  // Helper to find exact database service price for current vehicle + treatment
  const getExactPrice = (treatment: Treatment, vehicleTierId: string): number => {
    if (dbServices.length > 0) {
      const tierObj = VEHICLE_TIERS.find((v) => v.id === vehicleTierId);
      const tierKeywords = tierObj ? tierObj.variantKeywords : [vehicleTierId];

      // Try exact name match: e.g. "Premium Wash - Hatchback" or "Premium Wash - SUV/MUV"
      const matchedDbSvc = dbServices.find((s) => {
        const nameLower = s.name.toLowerCase();
        const matchesTreatment = treatment.searchKeywords.some((kw) => nameLower.includes(kw));
        const matchesVehicle = tierKeywords.some((vk) => nameLower.includes(vk));
        return matchesTreatment && matchesVehicle;
      });

      if (matchedDbSvc) {
        return matchedDbSvc.price;
      }

      // Fallback: match treatment keyword only if no vehicle variant found
      const fallbackTreatmentMatch = dbServices.find((s) =>
        treatment.searchKeywords.some((kw) => s.name.toLowerCase().includes(kw))
      );
      if (fallbackTreatmentMatch) {
        return fallbackTreatmentMatch.price;
      }
    }

    return treatment.defaultPrices[vehicleTierId] || treatment.defaultPrices.hatchback;
  };

  const calculatedPackagePrice = getExactPrice(currentTreatmentObj, selectedVehicle);

  const addonsTotalPrice = selectedAddons.reduce((acc, addonId) => {
    const addonObj = ADDONS.find((a) => a.id === addonId);
    if (!addonObj) return acc;

    // Check DB for exact addon price
    const matchedDbAddon = dbServices.find((s) =>
      addonObj.searchKeywords.some((kw) => s.name.toLowerCase().includes(kw))
    );

    return acc + (matchedDbAddon ? matchedDbAddon.price : addonObj.defaultPrice);
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
          Select your vehicle size, preferred detailing treatment, and optional care add-ons to generate an exact estimate matching our official package pricing.
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
          {TREATMENTS.map((treatment) => {
            const priceForSelectedVehicle = getExactPrice(treatment, selectedVehicle);
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
                  <span className="text-base font-black text-red-500">₹{priceForSelectedVehicle}</span>
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
          {ADDONS.map((addon) => {
            const isChecked = selectedAddons.includes(addon.id);
            const matchedDbAddon = dbServices.find((s) =>
              addon.searchKeywords.some((kw) => s.name.toLowerCase().includes(kw))
            );
            const addonPrice = matchedDbAddon ? matchedDbAddon.price : addon.defaultPrice;

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
                  <div className="text-xs font-bold text-red-400 mt-0.5">+₹{addonPrice}</div>
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
            Exact Total for {currentTier.name}
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
