import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { calculateCustomerCategories } from "@/lib/customerCategories";
import { requireRoles } from "@/lib/apiAuth";
import { generateNextCustomerId } from "@/lib/auth";
import {
  calculateServerBookingTotal,
  getIncludedAddonIds,
  type PricingDetail,
  type PricingOffer,
  type PricingService,
} from "@/lib/bookingPricing";
import { prisma } from "@/lib/prisma";

interface BookingRequestDetail {
  vehicleType?: string;
  serviceId?: string;
  addons?: string[];
  vehicleNumber?: string;
  vehicleValue?: number;
}

interface BookingRequestBody {
  customerName?: string;
  phoneNumber?: string;
  details?: BookingRequestDetail[];
  pickupDrop?: boolean;
  promoCode?: string;
  bookingDate?: string;
  bookingTime?: string;
  paymentMode?: string;
  notes?: string;
  referralCode?: string;
}

interface StoredBookingDetail extends PricingDetail {
  includedAddons: string[];
  vehicleNumber?: string;
  vehicleValue?: number;
}

interface BookingDetailsView {
  vehicleType: string;
  serviceType: string;
  addons: string[];
}

const isTenDigitIndianPhone = (phoneNumber: string) => /^\+91\d{10}$/.test(phoneNumber);

const sanitizeBookingDetails = (details: BookingRequestDetail[] | undefined): PricingDetail[] => {
  if (!details || details.length === 0) {
    throw new Error("Select at least one vehicle");
  }

  return details.map((detail) => {
    if (!detail.vehicleType || !detail.serviceId) {
      throw new Error("Select vehicle type and service for every vehicle");
    }

    return {
      vehicleType: detail.vehicleType,
      serviceId: detail.serviceId,
      addons: Array.isArray(detail.addons) ? detail.addons.filter(Boolean) : [],
    };
  });
};

const buildStoredDetails = (
  requestDetails: BookingRequestDetail[],
  sanitizedDetails: PricingDetail[],
  services: PricingService[]
): StoredBookingDetail[] => {
  return sanitizedDetails.map((detail, index) => {
    const service = services.find((item) => item.id === detail.serviceId);
    const includedAddons = service ? getIncludedAddonIds(service.name, services) : [];
    const requestDetail = requestDetails[index];

    return {
      ...detail,
      addons: (detail.addons || []).filter((addonId) => !includedAddons.includes(addonId)),
      includedAddons,
      vehicleNumber: requestDetail.vehicleNumber,
      vehicleValue: requestDetail.vehicleValue,
    };
  });
};

const buildBookingDetailsView = (details: unknown, services: PricingService[]): BookingDetailsView => {
  const serviceById = new Map(services.map((service) => [service.id, service]));
  const parsedDetails = Array.isArray(details) ? details as StoredBookingDetail[] : [];

  const vehicleTypes: string[] = [];
  const serviceTypes: string[] = [];
  const addons: string[] = [];

  for (const detail of parsedDetails) {
    vehicleTypes.push(detail.vehicleType || "-");

    const service = serviceById.get(detail.serviceId);
    serviceTypes.push(service?.name || "Service");

    for (const addonId of detail.addons || []) {
      const addon = serviceById.get(addonId);
      if (addon) addons.push(addon.name);
    }

    for (const addonId of detail.includedAddons || []) {
      const addon = serviceById.get(addonId);
      if (addon) addons.push(`${addon.name} (Included)`);
    }
  }

  return {
    vehicleType: vehicleTypes.join(", "),
    serviceType: serviceTypes.join(", "),
    addons,
  };
};

export async function POST(req: Request) {
  try {
    const body = await req.json() as BookingRequestBody;
    const customerName = body.customerName?.trim();
    const phoneNumber = body.phoneNumber?.trim();

    if (!customerName) {
      return NextResponse.json({ success: false, message: "Customer name is required" }, { status: 400 });
    }

    if (!phoneNumber || !isTenDigitIndianPhone(phoneNumber)) {
      return NextResponse.json({ success: false, message: "Enter valid 10 digit mobile number" }, { status: 400 });
    }

    if (!body.bookingDate || !body.bookingTime) {
      return NextResponse.json({ success: false, message: "Booking date and time are required" }, { status: 400 });
    }

    const sanitizedDetails = sanitizeBookingDetails(body.details);
    const services = await prisma.service.findMany({ where: { isActive: true } });
    const offers = await prisma.offer.findMany({ where: { isActive: true } });
    const pricing = calculateServerBookingTotal({
      details: sanitizedDetails,
      services,
      offers: offers as PricingOffer[],
      pickupDrop: Boolean(body.pickupDrop),
      promoCode: body.promoCode || "",
      bookingDate: body.bookingDate,
      bookingTime: body.bookingTime,
    });
    const storedDetails = buildStoredDetails(body.details || [], sanitizedDetails, services);

    let customer = await prisma.customer.findUnique({ where: { phoneNumber } });
    if (!customer) {
      const nextId = await generateNextCustomerId();
      customer = await prisma.customer.create({
        data: {
          id: nextId,
          customerName,
          phoneNumber,
        },
      });
    }

    for (const detail of storedDetails) {
      if (!detail.vehicleNumber) continue;

      const existingVehicle = await prisma.vehicle.findFirst({
        where: { customerId: customer.id, plateNumber: detail.vehicleNumber },
      });

      if (!existingVehicle) {
        await prisma.vehicle.create({
          data: {
            customerId: customer.id,
            plateNumber: detail.vehicleNumber,
            type: detail.vehicleType,
            value: detail.vehicleValue,
          },
        });
      }
    }

    const primaryServiceId = storedDetails[0]?.serviceId || null;
    const booking = await prisma.booking.create({
      data: {
        customerName,
        phoneNumber,
        pickupDrop: Boolean(body.pickupDrop),
        bookingDate: body.bookingDate,
        bookingTime: body.bookingTime,
        totalCost: pricing.total,
        paymentMode: body.paymentMode || "Cash",
        discount: pricing.discount,
        finalAmount: pricing.total,
        notes: body.notes || "",
        referralCode: body.referralCode || null,
        customerId: customer.id,
        serviceId: primaryServiceId,
        details: storedDetails as unknown as Prisma.InputJsonValue,
      },
    });

    const parseJsonArray = (val: unknown): any[] => {
      if (!val) return [];
      try {
        const parsed = typeof val === "string" ? JSON.parse(val) : val;
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    const visitHistory = parseJsonArray(customer.visitHistory);
    visitHistory.push(new Date().toISOString());

    const spendingHistory = parseJsonArray(customer.spendingHistory);
    spendingHistory.push({ date: new Date().toISOString(), amount: pricing.total });

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        customerName,
        totalVisits: { increment: 1 },
        totalSpent: { increment: pricing.total },
        lastVisit: new Date(),
        visitHistory: visitHistory as any,
        spendingHistory: spendingHistory as any,
      },
    });

    await calculateCustomerCategories(customer.id);

    if (body.referralCode) {
      const referrer = await prisma.customer.findFirst({ where: { referralCode: body.referralCode } });
      if (referrer) {
        await prisma.customer.update({ where: { id: referrer.id }, data: { referralPoints: { increment: 50 } } });
        await prisma.booking.update({ where: { id: booking.id }, data: { referralRewarded: true } });
        await prisma.customer.update({ where: { id: customer.id }, data: { referredBy: referrer.phoneNumber } }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      booking,
      pricing,
    });
  } catch (error) {
    console.log(error);
    const message = error instanceof Error ? error.message : "Booking failed";

    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

export async function GET() {
  const auth = await requireRoles(["admin", "manager", "supervisor", "staff"]);

  if (auth.response) {
    return auth.response;
  }

  try {
    const [bookings, services] = await Promise.all([
      prisma.booking.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.service.findMany(),
    ]);

    const responseBookings = bookings.map((booking) => {
      const view = buildBookingDetailsView(booking.details, services);

      return {
        ...booking,
        vehicleType: view.vehicleType,
        serviceType: view.serviceType,
        addons: view.addons,
      };
    });

    return NextResponse.json({ success: true, bookings: responseBookings });
  } catch (error) {
    console.log(error);

    return NextResponse.json({ success: false, message: "Failed to load bookings" }, { status: 500 });
  }
}
