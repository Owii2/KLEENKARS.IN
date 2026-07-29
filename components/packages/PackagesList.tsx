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

export function PackagesList() {
  const [packages, setPackages] = useState<GroupedPackage[]>([]);
  const [addons, setAddons] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json() as Promise<ServicesResponse>)
      .then((data) => {
        if (data.success) {
          const activeServices = data.services.filter((s) => s.isActive);

          const serviceGroups: Record<
            string,
            {
              name: string;
              description: string | null;
              category: string;
              prices: number[];
            }
          > = {};

          const addonsList: Service[] = [];

          const vehicleSpecificServicePattern =
            /^(.+?)\s*-\s*(Bike|Hatchback|Sedan|Hatchback\/Sedan|Sedan\/MUV|SUV|MUV|SUV\/MUV)$/i;

          activeServices.forEach((svc) => {
            if (svc.category === "Addon") {
              addonsList.push(svc);
              return;
            }

            const match = svc.name.match(vehicleSpecificServicePattern);
            if (match) {
              const genericName = match[1].trim();
              const vehicleType = match[2].trim();

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
                if (
                  svc.description &&
                  (!serviceGroups[genericName].description ||
                    svc.description.length > serviceGroups[genericName].description!.length)
                ) {
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

  if (loading) {
    return (
      <div className="py-12 sm:py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500 mb-4"></div>
        <p className="text-gray-400 text-sm">Loading car detailing packages...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* PACKAGES GRID */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-white flex items-center gap-3">
          <span className="w-2 h-6 bg-red-500 rounded-full inline-block"></span>
          Main Wash &amp; Detailing Packages
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex flex-col justify-between hover:border-red-500/50 transition-all duration-300 shadow-xl hover:shadow-red-500/5 group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-red-400 bg-red-950/40 border border-red-500/20 px-3 py-1 rounded-full">
                    {pkg.category}
                  </span>
                  <span className="text-xs text-gray-500">By Vehicle Size</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-red-400 transition-colors">
                  {pkg.name}
                </h3>

                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  {pkg.description || "Comprehensive interior and exterior car detailing treatment."}
                </p>
              </div>

              <div className="pt-6 sm:pt-8 border-t border-zinc-900/80 mt-6 sm:mt-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Pricing</div>
                  <div className="text-xl sm:text-2xl font-black text-white">{pkg.priceRange}</div>
                </div>

                <Link
                  href="/booking"
                  className="w-full sm:w-auto text-center bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition"
                >
                  Book Package
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ADDONS SECTION */}
      {addons.length > 0 && (
        <div className="pt-8 border-t border-zinc-900">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-white flex items-center gap-3">
            <span className="w-2 h-6 bg-red-500 rounded-full inline-block"></span>
            Add-on Care Treatments
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {addons.map((addon) => (
              <div
                key={addon.id}
                className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-bold text-white">{addon.name}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{addon.description}</p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-900">
                  <span className="text-base sm:text-lg font-bold text-red-500">₹{addon.price}</span>
                  <Link
                    href="/booking"
                    className="text-xs font-semibold text-gray-300 hover:text-white transition"
                  >
                    Add to Booking →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
