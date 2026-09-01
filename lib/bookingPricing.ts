export type VehicleType = "bike" | "hatchback" | "sedan" | "suv" | "muv" | "luxury" | "commercial" | "others";

export interface PricingService {
  id: string;
  name: string;
  price: number;
  category: string | null;
  isActive?: boolean;
}

export interface PricingOffer {
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
  validUntil: Date | string | null;
}

export interface PricingDetail {
  vehicleType: string;
  serviceId: string;
  addons?: string[];
}

export const pickupDropPricePerVehicle = 100;

export const includedAddonNamesByServiceName: Record<string, string[]> = {
  "Classic Wash": ["vacuum"],
  "Premium Wash": ["vacuum", "dashboard polish", "tyre shine", "perfume", "perfume sticker", "hanging perfume"],
  "Rainy Day Shine": ["vacuum", "dashboard polish", "tyre shine", "body wax", "perfume", "perfume sticker", "hanging perfume"],
  "Cabin Revive": ["vacuum", "dashboard polish", "perfume", "perfume sticker", "hanging perfume"],
  "Interior Deep Clean": ["vacuum", "dashboard polish", "perfume", "perfume sticker", "hanging perfume"],
  "Paint Restoration": ["body wax"],
  "Paint Correction": ["body wax"],
  "Ceramic Coating": ["vacuum", "dashboard polish", "tyre shine", "body wax", "perfume", "perfume sticker", "hanging perfume"],
  "PPF Protection": ["vacuum", "dashboard polish", "tyre shine", "body wax", "perfume", "perfume sticker", "hanging perfume"],
  "Commercial Fleet Detailing": ["vacuum", "dashboard polish", "tyre shine", "perfume"],
};

export const vehicleSuffixMap: Record<string, VehicleType[]> = {
  Bike: ["bike"],
  Hatchback: ["hatchback"],
  Sedan: ["sedan"],
  "Hatchback/Sedan": ["hatchback", "sedan"],
  "Sedan/MUV": ["sedan", "muv"],
  SUV: ["suv"],
  MUV: ["muv"],
  "SUV/MUV": ["suv", "muv"],
  Luxury: ["luxury"],
  "Commercial Vehicle": ["commercial"],
  Commercial: ["commercial"],
  Others: ["others"]
};

export const vehicleSpecificServicePattern = /^(.+?)\s*-\s*([A-Za-z0-9\/\-\s]+)$/i;

export const getVehicleTypesForSuffix = (suffix: string): VehicleType[] => {
  const normalizedSuffix = Object.keys(vehicleSuffixMap).find(
    (key) => key.toLowerCase() === suffix.toLowerCase()
  );

  return normalizedSuffix ? vehicleSuffixMap[normalizedSuffix] : [];
};

export const getBaseServiceName = (serviceName: string) => {
  const match = serviceName.match(vehicleSpecificServicePattern);

  return match ? match[1].trim() : serviceName;
};

export const getIncludedAddonIds = (serviceName: string, services: PricingService[]) => {
  const baseName = getBaseServiceName(serviceName);
  const includedKeywords = includedAddonNamesByServiceName[baseName] || [];

  return services
    .filter((service) => {
      if (service.category !== "Addon") return false;
      const addonNameLower = service.name.toLowerCase();
      return includedKeywords.some((kw) => addonNameLower.includes(kw.toLowerCase()));
    })
    .map((service) => service.id);
};

export const getDayName = (dateString: string) => {
  const date = new Date(dateString);

  return date.toLocaleDateString("en-US", { weekday: "long" });
};

export const calculateDiscount = ({
  subtotal,
  offers,
  details,
  promoCode,
  bookingDate,
  bookingTime,
}: {
  subtotal: number;
  offers: PricingOffer[];
  details: PricingDetail[];
  promoCode: string;
  bookingDate: string;
  bookingTime: string;
}) => {
  let bestDiscount = 0;
  let appliedOfferTitle = "";
  const enteredCode = promoCode.trim().toLowerCase();

  for (const offer of offers) {
    const offerCode = offer.code?.trim().toLowerCase();

    if (offerCode && offerCode !== enteredCode) continue;
    if (offer.validUntil && new Date(offer.validUntil) < new Date()) continue;
    if (details.length < offer.minVehicles) continue;

    if (bookingDate && offer.validDays && offer.validDays.length > 0) {
      const day = getDayName(bookingDate);
      if (!offer.validDays.includes(day)) continue;
    }

    if (bookingTime) {
      if (offer.startTime && bookingTime < offer.startTime) continue;
      if (offer.endTime && bookingTime > offer.endTime) continue;
    }

    if (offer.applicableServiceIds && offer.applicableServiceIds.length > 0) {
      const atLeastOneVehicleMatches = details.some((detail) => offer.applicableServiceIds.includes(detail.serviceId));
      if (!atLeastOneVehicleMatches) continue;
    }

    let currentDiscount = 0;

    if (offer.discountPercent > 0) {
      currentDiscount += (subtotal * offer.discountPercent) / 100;
    } else if (offer.discountAmount > 0) {
      currentDiscount += offer.discountAmount;
    }

    if (details.length >= 2 && offer.discountSecondVehicleAmount > 0) {
      currentDiscount += offer.discountSecondVehicleAmount;
    }

    if (currentDiscount > bestDiscount) {
      bestDiscount = currentDiscount;
      appliedOfferTitle = offer.title;
    }
  }

  return {
    discount: Math.round(bestDiscount),
    offerTitle: appliedOfferTitle,
  };
};

export const calculateServerBookingTotal = ({
  details,
  services,
  offers,
  pickupDrop,
  promoCode,
  bookingDate,
  bookingTime,
}: {
  details: PricingDetail[];
  services: PricingService[];
  offers: PricingOffer[];
  pickupDrop: boolean;
  promoCode: string;
  bookingDate: string;
  bookingTime: string;
}) => {
  let subtotal = 0;
  const serviceById = new Map(services.map((service) => [service.id, service]));

  for (const detail of details) {
    const service = serviceById.get(detail.serviceId);
    if (!service || service.category === "Addon") {
      throw new Error("Invalid service selected");
    }

    subtotal += service.price;

    const includedAddonIds = getIncludedAddonIds(service.name, services);

    for (const addonId of detail.addons || []) {
      if (includedAddonIds.includes(addonId)) continue;

      const addon = serviceById.get(addonId);
      if (!addon || addon.category !== "Addon") {
        throw new Error("Invalid add-on selected");
      }

      subtotal += addon.price;
    }
  }

  if (pickupDrop) {
    subtotal += pickupDropPricePerVehicle * details.length;
  }

  const { discount, offerTitle } = calculateDiscount({
    subtotal,
    offers,
    details,
    promoCode,
    bookingDate,
    bookingTime,
  });

  return {
    subtotal,
    discount,
    total: Math.max(0, subtotal - discount),
    offerTitle,
  };
};
