import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

interface CustomerTokenPayload {
  id?: string;
}

interface StoredBookingDetail {
  vehicleType: string;
  serviceId: string;
  addons?: string[];
  includedAddons?: string[];
}

const buildBookingDetailsView = (details: any, servicesList: any[]) => {
  const serviceById = new Map(servicesList.map((service) => [service.id, service]));
  const parsedDetails = Array.isArray(details) ? (details as StoredBookingDetail[]) : [];

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

export async function GET() {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });

    const payload = verifyToken(token) as CustomerTokenPayload | null;
    if (!payload || !payload.id) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });

    const customer = await prisma.customer.findUnique({
      where: { id: payload.id },
      include: {
        Booking: {
          orderBy: { createdAt: "desc" },
        },
        vehicles: true,
        memberships: {
          include: {
            membershipPlan: true,
          },
        },
      },
    });

    const services = await prisma.service.findMany();

    if (!customer) {
      const employee = await prisma.employee.findUnique({
        where: { id: payload.id },
      });

      if (employee) {
        return NextResponse.json({
          success: true,
          type: "employee",
          employee: {
            id: employee.id,
            employeeCode: employee.employeeCode,
            name: employee.name,
            phoneNumber: employee.phoneNumber,
            email: employee.email,
            role: employee.role,
            status: employee.status,
            salaryPerDay: employee.salaryPerDay,
            jobsCompleted: employee.jobsCompleted,
            customerRating: employee.customerRating,
            incentives: employee.incentives,
            penalties: employee.penalties,
          },
        });
      }

      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const responseBookings = customer.Booking.map((booking) => {
      const view = buildBookingDetailsView(booking.details, services);
      return {
        ...booking,
        vehicleType: view.vehicleType,
        serviceType: view.serviceType,
        addons: view.addons,
      };
    });

    const mappedMemberships = customer.memberships.map((m) => {
      let parsedBenefits: string[] = [];
      try {
        if (m.membershipPlan.benefits) {
          const parsed = typeof m.membershipPlan.benefits === "string"
            ? JSON.parse(m.membershipPlan.benefits)
            : m.membershipPlan.benefits;
          parsedBenefits = Array.isArray(parsed) ? parsed : (parsed.description ? [parsed.description] : []);
        }
      } catch {
        parsedBenefits = [];
      }

      return {
        id: m.id,
        planName: m.membershipPlan.name,
        startDate: m.startDate,
        endDate: m.endDate,
        status: m.status,
        benefits: parsedBenefits,
      };
    });

    const safe = {
      id: customer.id,
      customerName: customer.customerName,
      phone: customer.phoneNumber,
      email: customer.email,
      referralPoints: customer.referralPoints,
      totalSpent: customer.totalSpent,
      totalVisits: customer.totalVisits,
      primaryCategory: customer.primaryCategory,
      secondaryCategory: customer.secondaryCategory,
      bookings: responseBookings,
      vehicles: customer.vehicles,
      memberships: mappedMemberships,
    };

    return NextResponse.json({ success: true, customer: safe });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
