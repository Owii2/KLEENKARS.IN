"use client";

import { useState, useEffect, useRef } from "react";
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
  price: number;
  category: string;
  includedAddonIds?: string[];
  vehiclePrices?: Partial<Record<VehicleType, number>>;
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

const ALIGARH_LANDMARKS = [
  "Anoop Shahar Road, Aligarh",
  "Medical Road, Aligarh",
  "Civil Lines, Aligarh",
  "Ramghat Road, Aligarh",
  "Dodhpur, Aligarh",
  "Marris Road, Aligarh",
  "Centre Point, Aligarh",
  "Samad Road, Aligarh",
  "GT Road, Aligarh",
  "Jamalpur, Aligarh",
  "Sir Syed Nagar, Aligarh",
  "Kwesi / Aligarh Junction Area",
  "Shah Jamal, Aligarh",
  "Mustafa Market, Aligarh"
];

export default function BookingPage() {
  const [dbServices, setDbServices] = useState<Service[]>([]);
  const [dbOffers, setDbOffers] = useState<Offer[]>([]);
  const [displayServices, setDisplayServices] = useState<Service[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/services').then(res => res.json() as Promise<ServicesResponse>),
      fetch('/api/offers').then(res => res.json() as Promise<OffersResponse>)
    ]).then(([servicesData, offersData]) => {
      if (servicesData.success) {
        const activeServices: Service[] = servicesData.services.filter((s) => s.isActive);
        setDbServices(activeServices);

        const processedServices: Service[] = [];
        const serviceMap: Record<string, Service> = {};

        activeServices.forEach(svc => {
          const match = svc.name.match(vehicleSpecificServicePattern);
          if (match) {
            const genericName = match[1].trim();
            const vehicleTypes = getVehicleTypesForSuffix(match[2]);

            if (!serviceMap[genericName]) {
              serviceMap[genericName] = {
                ...svc,
                id: `service:${genericName}`,
                name: genericName,
                price: 0,
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
            processedServices.push({
              ...svc,
              includedAddonIds: getIncludedAddonIds(svc.name, activeServices),
            });
          }
        });

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
    const selectedService = getSelectedService(detail);
    if (!selectedService) return [];
    
    return getIncludedAddonIds(selectedService.name, dbServices);
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
  const [pickupAddress, setPickupAddress] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  
  const [promoCode, setPromoCode] = useState("");

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          if (data && data.display_name) {
            setPickupAddress(data.display_name);
          } else {
            setPickupAddress(`GPS Location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`);
          }
        } catch {
          setPickupAddress(`GPS Location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.error(err);
        setIsLocating(false);
        alert("Unable to retrieve location. Please type your pickup address manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

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
      const selectedService = displayServices.find((service) => service.id === value);
      const includedAddonIds = selectedService ? getIncludedAddonIds(selectedService.name, dbServices) : [];
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

    if (pickupDrop && !pickupAddress.trim()) {
      alert("Please enter or select your pickup & drop address");
      return;
    }

    if (!bookingDate) {
      alert("Please select a booking date");
      return;
    }

    const todayObj = new Date();
    const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;

    if (bookingDate < todayStr) {
      alert("❌ Past dates are not allowed. Please choose today or a future date.");
      return;
    }

    if (!bookingTime) {
      alert("Please select an appointment time slot");
      return;
    }

    if (bookingTime < "10:00" || bookingTime > "20:00") {
      alert("❌ Kleenkars is open from 10:00 AM to 08:00 PM. Please select a time slot within working hours.");
      return;
    }

    const currentHours = String(todayObj.getHours()).padStart(2, "0");
    const currentMins = String(todayObj.getMinutes()).padStart(2, "0");
    const currentTimeStr = `${currentHours}:${currentMins}`;

    if (bookingDate === todayStr && bookingTime <= currentTimeStr) {
      alert("❌ This time slot has already passed for today. Please select an upcoming time slot or a future date.");
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
          pickupAddress: pickupAddress.trim(),
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
        pickupAddress: pickupAddress.trim(),
      });

      if (data.whatsAppUrl) {
        window.open(data.whatsAppUrl, "_blank", "noopener,noreferrer");
      }

      alert(`🎉 Booking Submitted Successfully! (Ref: #${data.booking?.id || 'New'})\n\nAn Email Alert has been dispatched to our team, and WhatsApp has opened to notify the owner directly!`);

      setCustomerName("");
      setPhoneNumber("");
      setVehiclesCount(1);
      setVehicleDetails([{ vehicleType: "", serviceId: "", addons: [] }]);
      setPickupDrop(false);
      setPickupAddress("");
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
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
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
              className="w-full p-4 rounded-r-xl bg-zinc-900 border border-zinc-700 outline-none"
            />
          </div>

          <select
            value={vehiclesCount}
            onChange={(e) => setVehiclesCount(parseInt(e.target.value))}
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
                onChange={(e) => handleDetailChange(index, 'vehicleType', e.target.value)}
                className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-700"
              >
                <option value="">Select Vehicle Type</option>
                <option value="bike">Bike (Two-Wheeler)</option>
                <option value="hatchback">Hatchback (Swift, i20, Baleno, Tiago)</option>
                <option value="sedan">Sedan (City, Verna, Ciaz, Slavia, Dzire)</option>
                <option value="suv">SUV (Creta, Seltos, Thar, Scorpio, Nexon)</option>
                <option value="muv">MUV (Innova, Ertiga, Carens)</option>
                <option value="luxury">Luxury (BMW, Audi, Mercedes, Jaguar)</option>
                <option value="commercial">Commercial Vehicle (Trucks, Pickups, Vans, Travellers, E-Rickshaws & Fleet - Custom Pricing)</option>
                <option value="others">Others</option>
              </select>

              {detail.vehicleType && (
                <select
                  value={detail.serviceId}
                  onChange={(e) => handleDetailChange(index, 'serviceId', e.target.value)}
                  disabled={loadingOptions || Boolean(optionsError)}
                  className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-700"
                >
                  <option value="">Select Service</option>
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
              )}

              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-700">
                <h3 className="text-xl font-bold mb-4">Add-ons</h3>
                <div className="space-y-4">
                  {availableAddons.map((addon) => {
                    const included = isAddonIncluded(detail, addon.id);

                    return (
                      <label key={addon.id} className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-zinc-800/40">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={detail.addons.includes(addon.id) || included}
                            disabled={included}
                            onChange={() => handleAddonChange(index, addon.id)}
                            className="accent-red-600 disabled:opacity-80 w-4 h-4"
                          />
                          <span className={included ? "text-green-400 font-semibold" : ""}>
                            {addon.name}
                            {included && (
                              <span className="ml-2 text-xs font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/40">
                                ✓ Included in Package
                              </span>
                            )}
                          </span>
                        </div>
                        <span className={included ? "text-green-400 font-bold text-xs" : "text-gray-300 text-xs"}>
                          {included ? "Included" : `Rs. ${addon.price}`}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* PICKUP AND DROP OPTION & LOCATION SELECTOR */}
          <div className="space-y-3">
            <label className="flex items-center justify-between bg-zinc-900 p-4 rounded-xl border border-zinc-700 cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={pickupDrop}
                  onChange={() => setPickupDrop(!pickupDrop)}
                  className="accent-red-600 w-5 h-5"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-white">Doorstep Pickup & Drop</span>
                  <span className="text-xs text-gray-400">Free vehicle pickup & doorstep return in Aligarh</span>
                </div>
              </div>
              <span className="font-bold text-red-500">Rs. 100</span>
            </label>

            {pickupDrop && (
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📍</span> Pickup & Drop Address
                  </label>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={isLocating}
                    className="bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white px-3 py-1.5 rounded-lg border border-zinc-600 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isLocating ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Locating...</span>
                      </>
                    ) : (
                      <>
                        <span>🎯 Use GPS Location</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Landmark Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-400">
                    Choose Popular Area in Aligarh:
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        setPickupAddress((prev) => (prev ? `${e.target.value}, ${prev}` : e.target.value));
                      }
                    }}
                    className="w-full p-3 rounded-xl bg-black border border-zinc-700 text-xs text-white"
                  >
                    <option value="">Select Aligarh Area / Landmark (Optional)</option>
                    {ALIGARH_LANDMARKS.map((landmark, idx) => (
                      <option key={idx} value={landmark}>
                        {landmark}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Textarea for address input */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-400">
                    Full House / Street Address:
                  </label>
                  <textarea
                    required={pickupDrop}
                    rows={3}
                    placeholder="e.g. House No. 42, Near Medical College Gate 2, Civil Lines, Aligarh"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-black border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Discount Promo Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Got a Promo Code? Enter it here (e.g. SAVE10)"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-700 uppercase placeholder-zinc-500 focus:outline-none focus:border-red-500 text-sm"
              />
            </div>
          </div>

          {/* APPOINTMENT SCHEDULE CARD */}
          <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                <span>📅</span> Appointment Schedule
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                Open 7 Days • 10 AM - 8 PM
              </span>
            </div>

            {/* DATE SELECTOR */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
                <span>Select Service Date *</span>
                {bookingDate && (
                  <span className="text-[11px] font-mono text-red-400 font-bold">
                    {new Date(bookingDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                  </span>
                )}
              </label>

              {/* Quick Date Pills */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {(() => {
                  const today = new Date();
                  const tomorrow = new Date(today);
                  tomorrow.setDate(today.getDate() + 1);
                  const dayAfter = new Date(today);
                  dayAfter.setDate(today.getDate() + 2);

                  const formatDateStr = (d: Date) =>
                    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

                  const quickDates = [
                    { label: "Today", dateStr: formatDateStr(today) },
                    { label: "Tomorrow", dateStr: formatDateStr(tomorrow) },
                    {
                      label: dayAfter.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
                      dateStr: formatDateStr(dayAfter),
                    },
                  ];

                  return quickDates.map((q) => {
                    const isSelected = bookingDate === q.dateStr;
                    return (
                      <button
                        key={q.dateStr}
                        type="button"
                        onClick={() => setBookingDate(q.dateStr)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer whitespace-nowrap ${
                          isSelected
                            ? "bg-red-600 text-white border-red-500 shadow-md shadow-red-950/40"
                            : "bg-black/60 text-gray-400 border-zinc-800 hover:text-white hover:border-zinc-700"
                        }`}
                      >
                        {q.label}
                      </button>
                    );
                  });
                })()}
              </div>

              <div
                onClick={() => {
                  try {
                    dateInputRef.current?.showPicker?.();
                    dateInputRef.current?.focus();
                  } catch (err) {}
                }}
                className="relative cursor-pointer group"
              >
                <input
                  ref={dateInputRef}
                  type="date"
                  required
                  value={bookingDate}
                  onClick={(e) => {
                    try {
                      (e.currentTarget as any).showPicker?.();
                    } catch (err) {}
                  }}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={(() => {
                    const d = new Date();
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                  })()}
                  className="w-full p-3.5 rounded-xl bg-black border border-zinc-700 text-white text-sm font-semibold focus:outline-none focus:border-red-500 group-hover:border-zinc-500 cursor-pointer transition"
                />
              </div>
            </div>

            {/* TIME SELECTOR */}
            <div className="space-y-2 pt-2 border-t border-zinc-800/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-300">
                  Select Arrival / Slot Time (10:00 AM – 08:00 PM) *
                </label>
                {bookingTime && (
                  <span className="text-[11px] font-mono text-red-400 font-bold">
                    {bookingTime}
                  </span>
                )}
              </div>

              {/* Quick Time Slots between 10:00 AM and 08:00 PM */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {(() => {
                  const now = new Date();
                  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                  const currentHours = String(now.getHours()).padStart(2, "0");
                  const currentMins = String(now.getMinutes()).padStart(2, "0");
                  const currentTimeStr = `${currentHours}:${currentMins}`;
                  const isTodaySelected = bookingDate === todayStr;

                  const slots = [
                    { time: "10:00", label: "10:00 AM" },
                    { time: "11:00", label: "11:00 AM" },
                    { time: "12:00", label: "12:00 PM" },
                    { time: "13:00", label: "01:00 PM" },
                    { time: "14:00", label: "02:00 PM" },
                    { time: "15:00", label: "03:00 PM" },
                    { time: "16:00", label: "04:00 PM" },
                    { time: "17:00", label: "05:00 PM" },
                    { time: "18:00", label: "06:00 PM" },
                    { time: "19:00", label: "07:00 PM" },
                    { time: "20:00", label: "08:00 PM" },
                  ];

                  return slots.map((s) => {
                    const isPast = isTodaySelected && s.time <= currentTimeStr;
                    const isSelected = bookingTime === s.time;

                    return (
                      <button
                        key={s.time}
                        type="button"
                        disabled={isPast}
                        onClick={() => setBookingTime(s.time)}
                        className={`text-xs font-bold py-2 rounded-xl border text-center transition ${
                          isPast
                            ? "bg-zinc-950/50 text-zinc-600 border-zinc-850 cursor-not-allowed line-through opacity-40"
                            : isSelected
                            ? "bg-red-600 text-white border-red-500 shadow-md shadow-red-950/40 cursor-pointer"
                            : "bg-black/60 text-gray-300 border-zinc-800 hover:text-white hover:border-zinc-700 cursor-pointer"
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  });
                })()}
              </div>

              <div
                onClick={() => {
                  try {
                    timeInputRef.current?.showPicker?.();
                    timeInputRef.current?.focus();
                  } catch (err) {}
                }}
                className="relative cursor-pointer group"
              >
                <input
                  ref={timeInputRef}
                  type="time"
                  required
                  min="10:00"
                  max="20:00"
                  value={bookingTime}
                  onClick={(e) => {
                    try {
                      (e.currentTarget as any).showPicker?.();
                    } catch (err) {}
                  }}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-black border border-zinc-700 text-white text-sm font-semibold focus:outline-none focus:border-red-500 group-hover:border-zinc-500 cursor-pointer transition"
                />
              </div>
              <p className="text-[11px] text-gray-400">
                ⚡ Studio Working Hours: <strong className="text-gray-200">10:00 AM – 08:00 PM</strong>. Off-hours and past time slots are automatically blocked.
              </p>
            </div>
          </div>

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
            className="w-full bg-red-600 hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-zinc-700 transition-all p-5 rounded-xl text-xl font-bold cursor-pointer"
          >
            {isSubmitting ? "Submitting..." : "Confirm Booking"}
          </button>
        </form>
      </div>
    </main>
  );
}
