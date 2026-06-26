"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "../page.module.css";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  isActive: boolean;
}

interface GroupedPackage {
  id: string;
  name: string;
  description: string | null;
  category: string;
  minPrice: number;
  maxPrice: number;
  priceRange: string;
}

interface ServicesResponse {
  success: boolean;
  services: Service[];
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<GroupedPackage[]>([]);
  const [addons, setAddons] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json() as Promise<ServicesResponse>)
      .then((data) => {
        if (data.success) {
          const activeServices = data.services.filter((s) => s.isActive);
          
          // Group wash & detailing services
          const serviceGroups: Record<string, {
            name: string;
            description: string | null;
            category: string;
            prices: number[];
          }> = {};

          const addonsList: Service[] = [];

          const vehicleSpecificServicePattern = /^(.+?)\s*-\s*(Bike|Hatchback|Sedan|Hatchback\/Sedan|Sedan\/MUV|SUV|MUV|SUV\/MUV)$/i;

          activeServices.forEach((svc) => {
            if (svc.category === "Addon") {
              addonsList.push(svc);
              return;
            }

            const match = svc.name.match(vehicleSpecificServicePattern);
            if (match) {
              const genericName = match[1].trim();
              const vehicleType = match[2].trim();

              // Exclude Bike washes from the main car package groupings
              if (vehicleType.toLowerCase() === "bike") {
                return;
              }

              if (!serviceGroups[genericName]) {
                serviceGroups[genericName] = {
                  name: genericName,
                  description: svc.description,
                  category: svc.category || "Wash",
                  prices: [svc.price],
                };
              } else {
                serviceGroups[genericName].prices.push(svc.price);
                if (svc.description && (!serviceGroups[genericName].description || svc.description.length > serviceGroups[genericName].description!.length)) {
                  serviceGroups[genericName].description = svc.description;
                }
              }
            } else {
              if (!serviceGroups[svc.name]) {
                serviceGroups[svc.name] = {
                  name: svc.name,
                  description: svc.description,
                  category: svc.category || "Wash",
                  prices: [svc.price],
                };
              }
            }
          });

          const processedPackages: GroupedPackage[] = Object.values(serviceGroups).map((g) => {
            const minPrice = Math.min(...g.prices);
            const maxPrice = Math.max(...g.prices);
            return {
              id: `group:${g.name}`,
              name: g.name,
              description: g.description,
              category: g.category,
              minPrice,
              maxPrice,
              priceRange: minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} - ₹${maxPrice}`,
            };
          });

          setPackages(processedPackages);
          setAddons(addonsList);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const washPackages = packages.filter((p) => p.category === "Wash");
  const detailingPackages = packages.filter((p) => p.category === "Detailing");

  const upcomingServices = [
    {
      name: "Ceramic Coating (9H/10H Ultra Shield)",
      description: "Premium multi-layer nano-ceramic coating for extreme gloss, scratch resistance, and 3+ years of paint protection.",
      priceRange: "₹18,000 - ₹35,000",
      category: "Premium Detailing",
    },
    {
      name: "Paint Protection Film (PPF - Self-Healing TPU)",
      description: "High-grade thermoplastic polyurethane film providing ultimate defense against stone chips, scratches, and road debris.",
      priceRange: "₹65,000 - ₹1,40,000",
      category: "Premium Detailing",
    },
    {
      name: "Alloy Ceramic Protection",
      description: "Specialized heat-resistant coating protecting alloy wheels from brake dust, road grime, and salt oxidation.",
      priceRange: "₹3,999",
      category: "Premium Detailing",
    },
    {
      name: "Glass Hydrophobic Shield",
      description: "Advanced fluorine-based water-repellent coating for windshields and windows to maximize wet-weather visibility.",
      priceRange: "₹1,999",
      category: "Premium Detailing",
    },
    {
      name: "Leather & Alcantara Preserver",
      description: "Deep nourishment and anti-fouling sealant preventing stain absorption, dye transfer, and UV cracking on luxury upholstery.",
      priceRange: "₹4,999",
      category: "Premium Detailing",
    },
    {
      name: "Engine Bay Detail & Dressing",
      description: "Safe degreasing of the engine bay area, steam clean, and hydrophobic satin dressing of plastic and rubber pipes.",
      priceRange: "₹1,299",
      category: "Premium Detailing",
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white p-6 sm:p-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,45,45,0.1),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.05),_transparent_30%)] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-sm uppercase tracking-[0.3em] text-red-400 bg-white/5 rounded-full px-4 py-2 font-bold">
            Pricing & Packages
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Detailed Service Packages
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl">
            Explore our doorstep wash & detailing solutions, or preview our upcoming advanced detailing center catalog.
          </p>
        </div>

        {/* Navigation Actions */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-6">
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition flex items-center gap-2">
            ← Back to Home
          </Link>
          <Link href="/booking" className={styles.primaryBtn}>
            Proceed to Book
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-lg">Loading services catalog...</div>
        ) : (
          <div className="space-y-16">
            
            {/* Active Wash Packages */}
            <div className="space-y-6">
              <div className="border-l-4 border-red-500 pl-4">
                <h2 className="text-3xl font-black tracking-wide">Wash Packages</h2>
                <p className="text-gray-400 mt-1">Doorstep eco-washes and detailing prep.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {washPackages.map((pkg) => (
                  <div key={pkg.id} className={`${styles.serviceCard} flex flex-col justify-between p-8`}>
                    <div className="space-y-3">
                      <span className="text-xs uppercase tracking-widest text-red-400 bg-red-500/10 px-3 py-1 rounded-full font-bold">
                        {pkg.category}
                      </span>
                      <h3 className="text-2xl font-bold">{pkg.name}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {pkg.description || "Premium deep wash using micro-fiber cloths, high-pressure foam rinse, and paint finish drying."}
                      </p>
                    </div>
                    <div className="pt-6 border-t border-white/5 mt-6 flex justify-between items-center">
                      <span className="text-2xl font-black text-red-500">{pkg.priceRange}</span>
                      <Link href="/booking" className="text-sm font-bold text-white hover:text-red-400 transition">
                        Book Now →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Detailing Packages */}
            <div className="space-y-6">
              <div className="border-l-4 border-red-500 pl-4">
                <h2 className="text-3xl font-black tracking-wide">Detailing Services</h2>
                <p className="text-gray-400 mt-1">Deep restoration and cosmetic surface enhancement.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {detailingPackages.map((pkg) => (
                  <div key={pkg.id} className={`${styles.serviceCard} flex flex-col justify-between p-8`}>
                    <div className="space-y-3">
                      <span className="text-xs uppercase tracking-widest text-red-400 bg-red-500/10 px-3 py-1 rounded-full font-bold">
                        {pkg.category}
                      </span>
                      <h3 className="text-2xl font-bold">{pkg.name}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {pkg.description || "Full multi-step rubbing, claying, compounding, polishing, wax protection, and interior deep detailing."}
                      </p>
                    </div>
                    <div className="pt-6 border-t border-white/5 mt-6 flex justify-between items-center">
                      <span className="text-2xl font-black text-red-500">{pkg.priceRange}</span>
                      <Link href="/booking" className="text-sm font-bold text-white hover:text-red-400 transition">
                        Book Now →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add-ons Section */}
            <div className="space-y-6">
              <div className="border-l-4 border-red-500 pl-4">
                <h2 className="text-3xl font-black tracking-wide">Add-on Services</h2>
                <p className="text-gray-400 mt-1">Individual enhancements to complement your wash package.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {addons.map((svc) => (
                  <div key={svc.id} className={`${styles.serviceCard} flex flex-col justify-between p-8`}>
                    <div className="space-y-3">
                      <span className="text-xs uppercase tracking-widest text-red-400 bg-red-500/10 px-3 py-1 rounded-full font-bold">
                        Addon
                      </span>
                      <h3 className="text-2xl font-bold">{svc.name}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {svc.description || "Individual detailing add-on to customize your package."}
                      </p>
                    </div>
                    <div className="pt-6 border-t border-white/5 mt-6 flex justify-between items-center">
                      <span className="text-2xl font-black text-red-500">₹{svc.price}</span>
                      <Link href="/booking" className="text-sm font-bold text-white hover:text-red-400 transition">
                        Select Addon →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailing Center Services (Coming Soon) */}
            <div className="space-y-6">
              <div className="border-l-4 border-zinc-600 pl-4">
                <h2 className="text-3xl font-black tracking-wide text-zinc-400 flex items-center gap-3">
                  Detailing Center Services
                  <span className="text-xs uppercase tracking-widest bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full font-black border border-zinc-700 animate-pulse">
                    Coming Soon
                  </span>
                </h2>
                <p className="text-zinc-500 mt-1">Advanced protective treatments served directly at our state-of-the-art studio.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingServices.map((svc, index) => (
                  <div key={index} className="bg-zinc-950/60 border border-zinc-900 flex flex-col justify-between p-8 rounded-[1.5rem] opacity-75 hover:opacity-100 transition duration-300">
                    <div className="space-y-3">
                      <span className="text-[10px] uppercase tracking-widest text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-full font-bold border border-zinc-850">
                        {svc.category}
                      </span>
                      <h3 className="text-2xl font-bold text-zinc-300">{svc.name}</h3>
                      <p className="text-zinc-500 text-sm leading-relaxed">
                        {svc.description}
                      </p>
                    </div>
                    <div className="pt-6 border-t border-zinc-900 mt-6 flex justify-between items-center">
                      <span className="text-xl font-bold text-zinc-400">{svc.priceRange}</span>
                      <span className="text-xs font-black text-red-500/80 uppercase tracking-widest">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Footer Section */}
        <div className="border-t border-zinc-900 pt-10 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} KLEENKARS. Prices mentioned are estimated market prices for studio jobs and may vary by vehicle scale.</p>
        </div>
      </div>
    </main>
  );
}
