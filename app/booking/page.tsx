"use client";

import { useState, useEffect } from "react";

type VehicleType = "bike" | "hatchback" | "sedan" | "suv" | "muv";

interface Service {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface Offer {
  id: string;
  title: string;
  discountPercent: number;
  discountAmount: number;
  validDays: string[];
  startTime: string | null;
  endTime: string | null;
  applicableServiceIds: string[];
  minVehicles: number;
  discountSecondVehicleAmount: number;
  code: string | null;
  isActive: boolean;
  validUntil: string | null;
}

export default function BookingPage() {
  const [dbServices, setDbServices] = useState<Service[]>([]);
  const [dbOffers, setDbOffers] = useState<Offer[]>([]);
  
  useEffect(() => {
    Promise.all([
      fetch('/api/services').then(res => res.json()),
      fetch('/api/offers').then(res => res.json())
    ]).then(([servicesData, offersData]) => {
      if (servicesData.success) {
        setDbServices(servicesData.services.filter((s: any) => s.isActive));
      }
      if (offersData.success) {
        setDbOffers(offersData.offers.filter((o: any) => o.isActive));
      }
    }).catch(console.error);
  }, []);

  const washServices = dbServices.filter(s => s.category === 'Wash');
  const detailServices = dbServices.filter(s => s.category === 'Detailing');
  const availableAddons = dbServices.filter(s => s.category === 'Addon');

  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [vehicleType, setVehicleType] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");

  const [addons, setAddons] = useState<string[]>([]);

  const [pickupDrop, setPickupDrop] = useState(false);

  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  
  const [promoCode, setPromoCode] = useState("");
  const [vehiclesCount, setVehiclesCount] = useState<number>(1);

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const calculateDiscount = (subtotal: number) => {
    let bestDiscount = 0;
    let appliedOfferTitle = "";

    const enteredCode = promoCode.trim().toLowerCase();

    for (const offer of dbOffers) {
      // Check if code matches (if offer has a code) or if auto-apply (offer has no code)
      const offerCode = offer.code?.trim().toLowerCase();
      if (offerCode) {
        if (offerCode !== enteredCode) continue; // Promo code required but doesn't match
      } else {
        // Auto-apply offer
      }

      // Check Expiry
      if (offer.validUntil && new Date(offer.validUntil) < new Date()) continue;

      // Check Min Vehicles
      if (vehiclesCount < offer.minVehicles) continue;

      // Check Date
      if (bookingDate && offer.validDays && offer.validDays.length > 0) {
        const day = getDayName(bookingDate);
        if (!offer.validDays.includes(day)) continue;
      }

      // Check Time
      if (bookingTime) {
        if (offer.startTime && bookingTime < offer.startTime) continue;
        if (offer.endTime && bookingTime > offer.endTime) continue;
      }

      // Check Applicable Services
      if (selectedServiceId && offer.applicableServiceIds && offer.applicableServiceIds.length > 0) {
        if (!offer.applicableServiceIds.includes(selectedServiceId)) continue;
      }

      // Calculate the potential discount for this offer
      let currentDiscount = 0;
      
      // Calculate normal discount
      if (offer.discountPercent > 0) {
        currentDiscount += (subtotal * offer.discountPercent) / 100;
      } else if (offer.discountAmount > 0) {
        currentDiscount += offer.discountAmount;
      }

      // Add multi-vehicle discount if applicable
      if (vehiclesCount >= 2 && offer.discountSecondVehicleAmount > 0) {
        currentDiscount += offer.discountSecondVehicleAmount;
      }

      if (currentDiscount > bestDiscount) {
        bestDiscount = currentDiscount;
        appliedOfferTitle = offer.title;
      }
    }

    return { discount: bestDiscount, offerTitle: appliedOfferTitle };
  };

  const calculateTotal = () => {
    let subtotal = 0;
    
    if (selectedServiceId) {
      const svc = dbServices.find(s => s.id === selectedServiceId);
      if (svc) subtotal += (svc.price * vehiclesCount);
    }

    addons.forEach((addonId) => {
      const addon = dbServices.find(s => s.id === addonId);
      if (addon) subtotal += (addon.price * vehiclesCount);
    });

    if (pickupDrop) {
      subtotal += (100 * vehiclesCount);
    }

    const { discount, offerTitle } = calculateDiscount(subtotal);

    return { 
      subtotal, 
      discount, 
      total: Math.max(0, subtotal - discount),
      offerTitle
    };
  };

  const handleAddonChange = (addonId: string) => {
    if (addons.includes(addonId)) {
      setAddons(addons.filter((id) => id !== addonId));
    } else {
      setAddons([...addons, addonId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (phoneNumber.length !== 10) {
      alert("Enter valid 10 digit mobile number");
      return;
    }

    if (!customerName) {
      alert("Enter customer name");
      return;
    }

    if (!vehicleType) {
      alert("Select vehicle type");
      return;
    }

    if (!selectedServiceId) {
      alert("Select service");
      return;
    }

    if (!bookingDate) {
      alert("Select booking date");
      return;
    }

    if (!bookingTime) {
      alert("Select booking time");
      return;
    }

    const { total, subtotal, discount, offerTitle } = calculateTotal();
    const fullPhoneNumber = `+91${phoneNumber}`;

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          phoneNumber: fullPhoneNumber,
          vehicleType,
          serviceId: selectedServiceId, // Send ID directly
          addons: addons, // Send IDs directly
          pickupDrop,
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
        name: customerName,
        phone: fullPhoneNumber,
        service: selectedServiceId ? dbServices.find(s => s.id === selectedServiceId)?.name : "",
        amount: total,
        date: bookingDate,
        time: bookingTime,
        status: data.booking?.status || "Pending",
        vehicleType,
        addons: addons.map(id => dbServices.find(s => s.id === id)?.name),
        pickupDrop,
      });

      window.localStorage.setItem("bookings", JSON.stringify(localBookings));

      alert("Booking Submitted Successfully");

      setCustomerName("");
      setPhoneNumber("");
      setVehicleType("");
      setSelectedServiceId("");
      setAddons([]);
      setPickupDrop(false);
      setBookingDate("");
      setBookingTime("");
      setPromoCode("");
      setVehiclesCount(1);
    } catch (error) {
      console.log(error);
      alert("Something went wrong");
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
            value={vehicleType}
            onChange={(e) =>
              setVehicleType(e.target.value)
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

          <select
            value={selectedServiceId}
            onChange={(e) => {
              setSelectedServiceId(e.target.value);
              setAddons([]);
            }}
            className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-700"
          >

            <option value="">
              Select Service
            </option>

            {washServices.map((service) => (
              <option
                key={service.id}
                value={service.id}
              >
                {service.name} - Rs. {service.price}
              </option>
            ))}

            <optgroup label="Detailing">
              {detailServices.map((service) => (
                <option
                  key={service.id}
                  value={service.id}
                >
                  {service.name} - Rs. {service.price}
                </option>
              ))}
            </optgroup>

          </select>

          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-700">

            <h2 className="text-2xl font-bold mb-4">
              Add-ons
            </h2>

            <div className="space-y-4">

              {availableAddons.map((addon) => {

                // Optional: we can implement included addons dynamically later.
                // For now, they are just generic selectable addons.
                const included = false;

                return (

                  <label
                    key={addon.id}
                    className="flex items-center justify-between"
                  >

                    <div className="flex items-center gap-3">

                      <input
                        type="checkbox"
                        checked={
                          included || addons.includes(addon.id)
                        }
                        disabled={included}
                        onChange={() =>
                          handleAddonChange(addon.id)
                        }
                      />

                      <div>

                        <span>
                          {addon.name}
                        </span>

                        {included && (
                          <span className="text-green-400 text-sm ml-2">
                            Included
                          </span>
                        )}

                      </div>

                    </div>

                    <span>
                      ₹{addon.price}
                    </span>

                  </label>

                );
              })}

            </div>

          </div>

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
              ₹100
            </span>

          </label>

          <input
            type="text"
            placeholder="Got a Promo Code? Enter it here"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-700 uppercase"
          />

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
              <span>₹{calculateTotal().subtotal}</span>
            </div>
            
            {calculateTotal().discount > 0 && (
              <div className="flex justify-between text-lg font-bold text-yellow-300">
                <span>Discount {calculateTotal().offerTitle ? `(${calculateTotal().offerTitle})` : ""}:</span>
                <span>-₹{calculateTotal().discount}</span>
              </div>
            )}

            <div className="border-t border-red-400 pt-2 mt-2">
              <h2 className="text-3xl font-bold flex justify-between">
                <span>Total:</span>
                <span>₹{calculateTotal().total}</span>
              </h2>
            </div>

          </div>

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 transition-all p-5 rounded-xl text-xl font-bold"
          >
            Confirm Booking
          </button>

        </form>

      </div>

    </main>

  );
}
