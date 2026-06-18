"use client";

import { useState, useEffect } from "react";
import {
  calculateDiscount,
  getIncludedAddonIds,
  getVehicleTypesForSuffix,
  pickupDropPricePerVehicle,
  vehicleSpecificServicePattern,
  type PricingOffer,
  type VehicleType,
} from "@/lib/bookingPricing";

interface Service {
  id: string;
  name: string;
  price: number; // Default price, or price for a base vehicle type
  category: string;
  includedAddonIds?: string[];
  vehiclePrices?: Partial<Record<VehicleType, number>>; // Price variations per vehicle type
  vehicleServiceIds?: Partial<Record<VehicleType, string>>;
}

type Offer = PricingOffer;

interface ServicesResponse {
  success: boolean;
  services: Array<Service & { isActive?: boolean }>;
}

interface OffersResponse {
  success: boolean;
  offers: Offer[];
}

interface VehicleDetail {
  vehicleType: string;
  serviceId: string;
  addons: string[];
}

export default function BookingPage() {
  const [dbServices, setDbServices] = useState<Service[]>([]);
  const [dbOffers, setDbOffers] = useState<Offer[]>([]);
  const [displayServices, setDisplayServices] = useState<Service[]>([]); // New state for consolidated services
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/services').then(res => res.json() as Promise<ServicesResponse>),
      fetch('/api/offers').then(res => res.json() as Promise<OffersResponse>)
    ]).then(([servicesData, offersData]) => {
      if (servicesData.success) {
        const activeServices: Service[] = servicesData.services.filter((s) => s.isActive);
        setDbServices(activeServices);

        // Process services to consolidate vehicle-specific options
        const processedServices: Service[] = [];
        const serviceMap: Record<string, Service> = {}; // To store generic services

        activeServices.forEach(svc => {
          const match = svc.name.match(vehicleSpecificServicePattern);
          if (match) {
            const genericName = match[1].trim();
            const vehicleTypes = getVehicleTypesForSuffix(match[2]);

            if (!serviceMap[genericName]) {
              // Create a new generic service entry
              serviceMap[genericName] = {
                ...svc, // Copy existing properties like category
                id: `service:${genericName}`, // Use stable UI-only ID for grouped services
                name: genericName,
                price: 0, // Will be overridden by vehiclePrices
                vehiclePrices: {},
                vehicleServiceIds: {},
                includedAddonIds: getIncludedAddonIds(genericName, activeServices),
              };
            }

            vehicleTypes.forEach((vehicleType) => {
              serviceMap[genericName].vehiclePrices = {
                ...serviceMap[genericName].vehiclePrices,
                [vehicleType]: svc.price,
              };
              serviceMap[genericName].vehicleServiceIds = {
                ...serviceMap[genericName].vehicleServiceIds,
                [vehicleType]: svc.id,
              };
            });
          } else {
            // Add-ons and other non-vehicle-specific services
            processedServices.push({
              ...svc,
              includedAddonIds: getIncludedAddonIds(svc.name, activeServices),
            });
          }
        });

        // Add consolidated generic services to processedServices
        Object.values(serviceMap).forEach(genericSvc => processedServices.push(genericSvc));
        setDisplayServices(processedServices);
      } else {
        setOptionsError("Unable to load service options.");
      }
      if (offersData.success) {
        setDbOffers(offersData.offers.filter((o) => o.isActive));
      }
    }).catch((error) => {
      console.error(error);
      setOptionsError("Unable to load service options.");
    }).finally(() => {
      setLoadingOptions(false);
    });
  }, []);

  // Filter services for display based on displayServices
  const washServices = displayServices.filter(s => s.category === 'Wash');
  const detailServices = displayServices.filter(s => s.category === 'Detailing');
  const availableAddons = displayServices.filter(s => s.category === 'Addon');

  const getResolvedServiceId = (detail: VehicleDetail) => {
    const selectedService = displayServices.find((service) => service.id === detail.serviceId);
    const vehicleType = detail.vehicleType as VehicleType;

    return selectedService?.vehicleServiceIds?.[vehicleType] || detail.serviceId;
  };

  const getServicePrice = (service: Service, vehicleType: string) => {
    return service.vehiclePrices?.[vehicleType as VehicleType] ?? service.price;
  };

  const getServiceOptionLabel = (service: Service, vehicleType: string) => {
    const price = getServicePrice(service, vehicleType);
    const priceLabel = price > 0 ? `Rs. ${price}` : "Select vehicle type for price";

    return `${service.name} - ${priceLabel}`;
  };

  const isServiceAvailableForVehicle = (service: Service, vehicleType: string) => {
    if (!service.vehiclePrices) return true;
    if (!vehicleType) return true;

    return service.vehiclePrices[vehicleType as VehicleType] !== undefined;
  };

  const getSelectedService = (detail: VehicleDetail) => {
    return displayServices.find((service) => service.id === detail.serviceId);
  };

  const getIncludedAddonIdsForDetail = (detail: VehicleDetail) => {
    return getSelectedService(detail)?.includedAddonIds || [];
  };

  const isAddonIncluded = (detail: VehicleDetail, addonId: string) => {
    return getIncludedAddonIdsForDetail(detail).includes(addonId);
  };

  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [vehiclesCount, setVehiclesCount] = useState<number>(1);
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetail[]>([
    { vehicleType: "", serviceId: "", addons: [] },
  ]);

  useEffect(() => {
    setVehicleDetails((currentDetails) => {
      const newDetails = [...currentDetails];
      // Adjust the array size to match the number of vehicles
      while (newDetails.length < vehiclesCount) {
        newDetails.push({ vehicleType: "", serviceId: "", addons: [] });
      }
      if (newDetails.length > vehiclesCount) {
        newDetails.length = vehiclesCount;
      }
      return newDetails;
    });
  }, [vehiclesCount]);

  const [pickupDrop, setPickupDrop] = useState(false);

  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  
  const [promoCode, setPromoCode] = useState("");

  const calculateTotal = () => {
    let subtotal = 0;

    vehicleDetails.forEach(detail => {
      if (detail.serviceId) {
        const svc = displayServices.find(s => s.id === detail.serviceId);
        if (svc) subtotal += getServicePrice(svc, detail.vehicleType);
      }
      detail.addons.forEach((addonId) => {
        if (isAddonIncluded(detail, addonId)) return;
        const addon = dbServices.find(s => s.id === addonId);
        if (addon) subtotal += addon.price;
      });
    });

    if (pickupDrop) {
      subtotal += (pickupDropPricePerVehicle * vehiclesCount);
    }

    const { discount, offerTitle } = calculateDiscount({
      subtotal,
      offers: dbOffers,
      details: vehicleDetails.map((detail) => ({
        ...detail,
        serviceId: getResolvedServiceId(detail),
      })),
      promoCode,
      bookingDate,
      bookingTime,
    });

    return { 
      subtotal, 
      discount, 
      total: Math.max(0, subtotal - discount),
      offerTitle
    };
  };

  const handleDetailChange = (index: number, field: keyof VehicleDetail, value: string | string[]) => {
    const newDetails = [...vehicleDetails];
    if (field === 'addons' && Array.isArray(value)) {
      newDetails[index].addons = value;
    } else if (field === 'vehicleType' && typeof value === 'string') {
      newDetails[index].vehicleType = value;
      const selectedService = displayServices.find((service) => service.id === newDetails[index].serviceId);
      if (selectedService && !isServiceAvailableForVehicle(selectedService, value)) {
        newDetails[index].serviceId = "";
        newDetails[index].addons = [];
      }
    } else if (field === 'serviceId' && typeof value === 'string') {
      newDetails[index].serviceId = value;
      const includedAddonIds = displayServices.find((service) => service.id === value)?.includedAddonIds || [];
      newDetails[index].addons = newDetails[index].addons.filter((addonId) => !includedAddonIds.includes(addonId));
    }
    setVehicleDetails(newDetails);
  };

  const handleAddonChange = (vehicleIndex: number, addonId: string) => {
    const newDetails = [...vehicleDetails];
    if (isAddonIncluded(newDetails[vehicleIndex], addonId)) return;

    const currentAddons = newDetails[vehicleIndex].addons;
    if (currentAddons.includes(addonId)) {
      newDetails[vehicleIndex].addons = currentAddons.filter((id) => id !== addonId);
    } else {
      newDetails[vehicleIndex].addons.push(addonId);
    }
    setVehicleDetails(newDetails);
  };

  const totals = calculateTotal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (phoneNumber.length !== 10) {
      alert("Enter valid 10 digit mobile number");
      return;
    }

    const trimmedCustomerName = customerName.trim();

    if (!trimmedCustomerName) {
      alert("Enter customer name");
      return;
    }

    for (const detail of vehicleDetails) {
      if (!detail.vehicleType) {
        alert("Select vehicle type for all vehicles");
        return;
      }
      if (!detail.serviceId) {
        alert("Select a service for all vehicles");
        return;
      }
    }

    if (!bookingDate) {
      alert("Select booking date");
      return;
    }

    if (!bookingTime) {
      alert("Select booking time");
      return;
    }

    const { total } = totals;
    const fullPhoneNumber = `+91${phoneNumber}`;
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: trimmedCustomerName,
          phoneNumber: fullPhoneNumber,
          details: vehicleDetails.map((detail) => {
            const includedAddonIds = getIncludedAddonIdsForDetail(detail);

            return {
              ...detail,
              serviceId: getResolvedServiceId(detail),
              addons: detail.addons.filter((addonId) => !includedAddonIds.includes(addonId)),
              includedAddons: includedAddonIds,
            };
          }),
          pickupDrop,
          promoCode,
          bookingDate,
          bookingTime,
          totalCost: total,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Booking Failed");
        return;
      }

      const localBookings = JSON.parse(
        window.localStorage.getItem("bookings") || "[]"
      );

      localBookings.push({
        id: data.booking?.id || `BKG${localBookings.length + 1}`,
        name: trimmedCustomerName,
        phone: fullPhoneNumber,
        service: vehicleDetails.map(d => displayServices.find(s => s.id === d.serviceId)?.name).join(', '),
        amount: total,
        date: bookingDate,
        time: bookingTime,
        status: data.booking?.status || "Pending",
        vehicleType: vehicleDetails.map(d => d.vehicleType).join(', '),
        addons: vehicleDetails.flatMap((detail) => {
          const paidAddons = detail.addons
            .map(id => dbServices.find(s => s.id === id)?.name)
            .filter((name): name is string => Boolean(name));
          const includedAddons = getIncludedAddonIdsForDetail(detail).map((id) => {
            const addonName = dbServices.find(s => s.id === id)?.name;

            return addonName ? `${addonName} (Included)` : undefined;
          }).filter((name): name is string => Boolean(name));

          return [...paidAddons, ...includedAddons];
        }),
        pickupDrop,
      });

      window.localStorage.setItem("bookings", JSON.stringify(localBookings));

      alert("Booking Submitted Successfully");

      setCustomerName("");
      setPhoneNumber("");
      setVehiclesCount(1);
      setVehicleDetails([{ vehicleType: "", serviceId: "", addons: [] }]);
      setPickupDrop(false);
      setBookingDate("");
      setBookingTime("");
      setPromoCode("");
    } catch (error) {
      console.log(error);
      alert("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (

    <main className="min-h-screen bg-black text-white p-5 sm:p-8">

      <div className="max-w-3xl mx-auto">

        <h1 className="text-5xl font-bold text-red-500 mb-10">
          Book Your Wash
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          <input
            type="text"
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) =>
              setCustomerName(e.target.value)
            }
            className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-700"
          />

          <div className="flex">

            <div className="bg-zinc-800 border border-zinc-700 px-4 flex items-center rounded-l-xl">
              +91
            </div>

            <input
              type="tel"
              placeholder="Enter 10 digit mobile number"
              maxLength={10}
              value={phoneNumber}
              onChange={(e) =>
                setPhoneNumber(
                  e.target.value.replace(/\D/g, "")
                )
              }
              className="w-full p-4 rounded-r-xl bg-zinc-900 border border-zinc-700 outline-none"
            />

          </div>

          <select
            value={vehiclesCount}
            onChange={(e) =>
              setVehiclesCount(parseInt(e.target.value))
            }
            className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-700"
          >
            <option value={1}>1 Vehicle</option>
            <option value={2}>2 Vehicles</option>
            <option value={3}>3 Vehicles</option>
            <option value={4}>4 Vehicles</option>
          </select>

          {loadingOptions && (
            <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-gray-300">
              Loading services...
            </div>
          )}

          {optionsError && (
            <div className="rounded-xl border border-red-500/60 bg-red-950/40 p-4 text-red-100">
              {optionsError}
            </div>
          )}
          
          {vehicleDetails.map((detail, index) => (
            <div key={index} className="space-y-4 border border-zinc-800 p-4 rounded-xl bg-zinc-900/50">
              <h2 className="font-bold text-lg text-red-500">Vehicle {index + 1}</h2>
              <select
                value={detail.vehicleType}
                onChange={(e) =>
                  handleDetailChange(index, 'vehicleType', e.target.value)
                }
                className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-700"
              >
                <option value="">Select Vehicle Type</option>
                <option value="bike">Bike</option>
                <option value="hatchback">Hatchback</option>
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="muv">MUV</option>
              </select>

              <select
                value={detail.serviceId}
                onChange={(e) => {
                  handleDetailChange(index, 'serviceId', e.target.value);
                }}
                disabled={!detail.vehicleType || loadingOptions || Boolean(optionsError)}
                className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-700"
              >
                <option value="">{detail.vehicleType ? "Select Service" : "Select vehicle type first"}</option>
                {washServices.filter((service) => isServiceAvailableForVehicle(service, detail.vehicleType)).map((service) => (
                  <option key={service.id} value={service.id}>
                    {getServiceOptionLabel(service, detail.vehicleType)}
                  </option>
                ))}
                <optgroup label="Detailing">
                  {detailServices.filter((service) => isServiceAvailableForVehicle(service, detail.vehicleType)).map((service) => (
                    <option key={service.id} value={service.id}>
                      {getServiceOptionLabel(service, detail.vehicleType)}
                    </option>
                  ))}
                </optgroup>
              </select>

              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-700">
                <h3 className="text-xl font-bold mb-4">Add-ons</h3>
                <div className="space-y-4">
                  {availableAddons.map((addon) => {
                    const included = isAddonIncluded(detail, addon.id);

                    return (
                      <label key={addon.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={detail.addons.includes(addon.id) || included}
                            disabled={included}
                            onChange={() => handleAddonChange(index, addon.id)}
                            className="accent-red-600 disabled:opacity-70"
                          />
                          <span className={included ? "text-gray-400" : ""}>
                            {addon.name}
                            {included && (
                              <span className="ml-2 text-xs font-bold text-green-400">Included</span>
                            )}
                          </span>
                        </div>
                        <span>{included ? "Included" : `Rs. ${addon.price}`}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          <label className="flex items-center justify-between bg-zinc-900 p-4 rounded-xl border border-zinc-700">

            <div className="flex items-center gap-3">

              <input
                type="checkbox"
                checked={pickupDrop}
                onChange={() =>
                  setPickupDrop(!pickupDrop)
                }
              />

              <span>
                Pickup & Drop
              </span>

            </div>

            <span>
              Rs. 100
            </span>

          </label>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Got a Promo Code? Enter it here"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-700 uppercase"
            />
          </div>

          <input
            type="date"
            value={bookingDate}
            onChange={(e) =>
              setBookingDate(e.target.value)
            }
            min={new Date().toISOString().split("T")[0]}
            className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-700"
          />

          <input
            type="time"
            value={bookingTime}
            onChange={(e) =>
              setBookingTime(e.target.value)
            }
            className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-700"
          />

          <div className="bg-red-500 p-6 rounded-xl space-y-2">

            <div className="flex justify-between text-lg">
              <span>Subtotal:</span>
              <span>Rs. {totals.subtotal}</span>
            </div>
            
            {totals.discount > 0 && (
              <div className="flex justify-between text-lg font-bold text-yellow-300">
                <span>Discount {totals.offerTitle ? `(${totals.offerTitle})` : ""}:</span>
                <span>-Rs. {totals.discount}</span>
              </div>
            )}

            <div className="border-t border-red-400 pt-2 mt-2">
              <h2 className="text-3xl font-bold flex justify-between">
                <span>Total:</span>
                <span>Rs. {totals.total}</span>
              </h2>
            </div>

          </div>

          <button
            type="submit"
            disabled={isSubmitting || loadingOptions || Boolean(optionsError)}
            className="w-full bg-red-600 hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-zinc-700 transition-all p-5 rounded-xl text-xl font-bold"
          >
            {isSubmitting ? "Submitting..." : "Confirm Booking"}
          </button>

        </form>

      </div>

    </main>

  );
}
