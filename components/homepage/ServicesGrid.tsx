"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "@/app/page.module.css";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  isActive: boolean;
  isStartingPrice?: boolean;
}

export function ServicesGrid() {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const activeServices = data.services.filter((s: Service) => s.isActive);
          const consolidated: Service[] = [];
          const serviceMap: Record<string, Service & { prices: number[] }> = {};

          const vehicleSpecificServicePattern =
            /^(.+?)\s*-\s*(Bike|Hatchback|Sedan|Hatchback\/Sedan|Sedan\/MUV|SUV|MUV|SUV\/MUV)$/i;

          activeServices.forEach((svc: Service) => {
            if (svc.category === "Addon") {
              return;
            }

            const match = svc.name.match(vehicleSpecificServicePattern);
            if (match) {
              const genericName = match[1].trim();
              const vehicleType = match[2].trim();
              if (vehicleType.toLowerCase() === "bike") {
                return;
              }
              if (!serviceMap[genericName]) {
                serviceMap[genericName] = {
                  ...svc,
                  id: `group:${genericName}`,
                  name: genericName,
                  prices: [svc.price],
                };
              } else {
                serviceMap[genericName].prices.push(svc.price);
              }
            } else {
              consolidated.push(svc);
            }
          });

          Object.values(serviceMap).forEach((groupSvc) => {
            const minPrice = Math.min(...groupSvc.prices);
            consolidated.push({
              ...groupSvc,
              price: minPrice,
              isStartingPrice: true,
            });
          });

          setServices(consolidated);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {services.map((item) => (
        <div key={item.id} className={`${styles.serviceCard} p-5 sm:p-8 flex flex-col justify-between`}>
          <div className="mb-4">
            <h3 className="text-xl sm:text-2xl font-semibold mb-2 text-white">{item.name}</h3>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{item.description}</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-6">
            <span className="text-xl sm:text-2xl font-black text-red-500">
              {item.isStartingPrice ? `Starting at ₹${item.price}` : `₹${item.price}`}
            </span>

            <Link href="/booking" className={`${styles.primaryBtn} w-full sm:w-auto text-center`}>
              Book now
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
