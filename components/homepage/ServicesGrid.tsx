"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import styles from "@/app/page.module.css";

interface FeaturedService {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  features: string[];
  dbQueryKeyword: string;
  fallbackPrice: number;
  pricePrefix?: string;
  ctaText: string;
  ctaLink: string;
  isPopular?: boolean;
}

const FEATURED_FLAGSHIP_SERVICES: FeaturedService[] = [
  {
    id: "premium-wash",
    name: "Premium Foam Wash & Vacuum",
    badge: "🔥 Most Popular",
    badgeColor: "bg-red-600/20 text-red-400 border-red-500/30",
    description: "Complete exterior snow foam bath with deep interior vacuuming and dressing for everyday spotless perfection.",
    features: [
      "pH-neutral high-density snow foam wash",
      "Full interior cabin & boot vacuum",
      "Dashboard polish & tyre gloss conditioning",
      "Doorstep pickup available across Aligarh",
    ],
    dbQueryKeyword: "premium wash",
    fallbackPrice: 299,
    pricePrefix: "Starting at",
    ctaText: "Book Wash",
    ctaLink: "/booking",
    isPopular: true,
  },
  {
    id: "rainy-day",
    name: "Rainy Day Shine & Weather Shield",
    badge: "🌧️ Weather Guard",
    badgeColor: "bg-blue-600/20 text-blue-400 border-blue-500/30",
    description: "Hydrophobic exterior coating and glass rain-repellent shield formulated for rainy drives and dusty Aligarh roads.",
    features: [
      "Hydrophobic rain-repellent spray sealant",
      "High-pressure underbody mud clearance",
      "Windshield & side glass water beading coat",
      "High-gloss exterior protective layer",
    ],
    dbQueryKeyword: "rainy day shine",
    fallbackPrice: 399,
    pricePrefix: "Starting at",
    ctaText: "Book Shield",
    ctaLink: "/booking",
  },
  {
    id: "cabin-revive",
    name: "Deep Interior Spa & Steam Revive",
    badge: "✨ 140°C Sanitized",
    badgeColor: "bg-emerald-600/20 text-emerald-400 border-emerald-500/30",
    description: "140°C high-temperature steam extraction and anti-bacterial cleaning for a brand-new, hygienic cabin.",
    features: [
      "Deep upholstery steam extraction & shampoo",
      "Leather cleansing & nourishing conditioner",
      "AC duct anti-bacterial fogging & odor purge",
      "Roof lining, door pad & mat deep scrubbing",
    ],
    dbQueryKeyword: "cabin revive",
    fallbackPrice: 1299,
    pricePrefix: "Starting at",
    ctaText: "Book Interior Spa",
    ctaLink: "/booking",
  },
  {
    id: "paint-restoration",
    name: "Dual-Action Paint Correction",
    badge: "🏎️ Swirl Removal",
    badgeColor: "bg-amber-600/20 text-amber-400 border-amber-500/30",
    description: "Multi-stage machine compounding and polishing to eliminate swirls, oxidation, and restore deep showroom mirror gloss.",
    features: [
      "Dual-action machine compound & polish",
      "Eliminates 85%+ micro-scratches & swirls",
      "Restores true vibrant color depth",
      "Finished with protective synthetic sealant",
    ],
    dbQueryKeyword: "paint restoration",
    fallbackPrice: 1499,
    pricePrefix: "Starting at",
    ctaText: "Book Paint Polish",
    ctaLink: "/booking",
  },
  {
    id: "ceramic-coating",
    name: "9H & 10H Ceramic Coating",
    badge: "🛡️ 3-5 Year Armor",
    badgeColor: "bg-purple-600/20 text-purple-400 border-purple-500/30",
    description: "Permanent nanoceramic glass shield defending against UV rays, acid rain, scratches, and delivering permanent wet gloss.",
    features: [
      "Permanent SiO2 chemical bond layer",
      "Extreme hydrophobic water & mud beading",
      "UV & industrial fallout oxidation defense",
      "Official warranty certificate included",
    ],
    dbQueryKeyword: "ceramic coating",
    fallbackPrice: 5999,
    pricePrefix: "Starting at",
    ctaText: "Explore Ceramic",
    ctaLink: "/services/ceramic-coating",
  },
  {
    id: "ppf-protection",
    name: "Self-Healing TPU Paint Protection Film",
    badge: "💎 Ultimate Shield",
    badgeColor: "bg-cyan-600/20 text-cyan-400 border-cyan-500/30",
    description: "Military-grade ultra-clear TPU film offering complete defense against rock chips, scratches, and road debris.",
    features: [
      "Instant self-healing with sun or heat gun",
      "100% stone chip & gravel scratch defense",
      "Optical clarity with non-yellowing guarantee",
      "Custom full-body & partial impact packs",
    ],
    dbQueryKeyword: "ppf protection",
    fallbackPrice: 45000,
    pricePrefix: "Starting at",
    ctaText: "Explore PPF",
    ctaLink: "/services/paint-protection-film",
  },
];

export function ServicesGrid() {
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.services)) {
          const activeServices = data.services.filter((s: { isActive?: boolean }) => s.isActive !== false);
          const priceMap: Record<string, number> = {};

          FEATURED_FLAGSHIP_SERVICES.forEach((item) => {
            const matches = activeServices.filter((s: { name: string; price: number }) =>
              s.name.toLowerCase().includes(item.dbQueryKeyword)
            );
            if (matches.length > 0) {
              const minPrice = Math.min(...matches.map((m: { price: number }) => m.price));
              priceMap[item.id] = minPrice;
            } else {
              priceMap[item.id] = item.fallbackPrice;
            }
          });

          setPrices(priceMap);
        }
      })
      .catch((err) => {
        console.error("Error loading services for homepage grid:", err);
      });
  }, []);

  return (
    <div className="space-y-10">
      {/* 6 Curated Flagship Package Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURED_FLAGSHIP_SERVICES.map((item) => {
          const price = prices[item.id] || item.fallbackPrice;

          return (
            <div
              key={item.id}
              className={`relative bg-[#0d0d10] border ${
                item.isPopular ? "border-red-600/50 shadow-red-950/20 shadow-xl" : "border-zinc-800"
              } rounded-3xl p-6 sm:p-7 flex flex-col justify-between hover:border-red-500/40 hover:-translate-y-1.5 transition-all duration-300 group`}
            >
              {item.isPopular && (
                <div className="absolute -top-3 right-6 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg shadow-red-950/60">
                  Customer Favorite
                </div>
              )}

              <div>
                {/* Badge Tag */}
                <div className="mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold font-mono px-3 py-1 rounded-full border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-red-400 transition mb-2">
                  {item.name}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-5">{item.description}</p>

                {/* Key Bullet Features */}
                <ul className="space-y-2 mb-6 border-t border-zinc-800/80 pt-4">
                  {item.features.map((feat, idx) => (
                    <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price & Direct CTA */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-3 mt-auto">
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                    {item.pricePrefix || "Price"}
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono">
                    ₹{price.toLocaleString("en-IN")}
                  </div>
                </div>

                <Link
                  href={item.ctaLink}
                  className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition shadow-lg shadow-red-950/40 active:scale-95 whitespace-nowrap"
                >
                  <span>{item.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Catalog Hub Banner */}
      <div className="bg-gradient-to-r from-zinc-950 via-[#0e0a0a] to-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-1 text-center md:text-left">
          <div className="text-sm font-bold text-red-400 uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Looking for More Vehicle Packages or Custom Add-ons?</span>
          </div>
          <h4 className="text-xl sm:text-2xl font-black text-white">
            Explore Our Complete Detailing &amp; Doorstep Wash Menu
          </h4>
          <p className="text-xs text-gray-400 max-w-xl">
            View transparent pricing for Hatchbacks, Sedans, SUVs, Luxury Cars, Two-Wheelers &amp; Commercial Fleets with custom add-ons.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto flex-shrink-0">
          <Link
            href="/packages"
            className="w-full sm:w-auto text-center bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition"
          >
            All 20+ Packages
          </Link>
          <Link
            href="/#estimator"
            className="w-full sm:w-auto text-center bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition shadow-lg shadow-red-950/50"
          >
            Instant Price Estimator
          </Link>
        </div>
      </div>
    </div>
  );
}
