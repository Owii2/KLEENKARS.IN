import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface CustomerCategoryInput {
  id: string;
  totalVisits: number;
  totalSpent: number;
  referredBy: string | null;
  lastVisit: Date | null;
}

interface CategoryRule {
  type: "manual" | "auto" | "secondary";
  priority: number;
  name: string;
  criteria?: (customer: CustomerCategoryInput) => boolean | Promise<boolean>;
}

interface CategoryHistoryEntry {
  date: string;
  primaryCategory: string | null;
  secondaryCategory: string | null;
  changedBy: string;
}

export const CATEGORY_RULES: Record<string, CategoryRule> = {
  STAFF: { type: "manual", priority: 1, name: "STAFF" },
  FAMILY: { type: "manual", priority: 2, name: "FAMILY" },
  FRIENDS: { type: "manual", priority: 3, name: "FRIENDS" },
  FLEET: {
    type: "auto",
    priority: 4,
    name: "FLEET",
    criteria: async (customer) => {
      const vehicleCount = await prisma.vehicle.count({ where: { customerId: customer.id } });
      return vehicleCount >= 3;
    },
  },
  VIP: {
    type: "auto",
    priority: 5,
    name: "VIP",
    criteria: (customer) => customer.totalVisits >= 8 || customer.totalSpent >= 5000,
  },
  PREMIUM: {
    type: "auto",
    priority: 6,
    name: "PREMIUM",
    criteria: async (customer) => {
      const vehicles = await prisma.vehicle.findMany({ where: { customerId: customer.id } });
      return vehicles.some((vehicle) => (vehicle.value || 0) >= 15);
    },
  },
  REGULAR: {
    type: "auto",
    priority: 7,
    name: "REGULAR",
    criteria: (customer) => customer.totalVisits >= 3 && customer.totalVisits <= 7,
  },
  NEW: {
    type: "auto",
    priority: 8,
    name: "NEW",
    criteria: (customer) => customer.totalVisits >= 0 && customer.totalVisits <= 2,
  },
  VALUE: {
    type: "auto",
    priority: 9,
    name: "VALUE",
    criteria: async (customer) => {
      const bookings = await prisma.booking.findMany({ where: { customerId: customer.id } });
      if (bookings.length === 0) return false;

      const lowCostServices = [
        "Express Wash - Bike",
        "Express Wash - Hatchback/Sedan",
        "Express Wash - SUV/MUV",
        "Classic Wash - Hatchback/Sedan",
        "Classic Wash - SUV/MUV",
      ];
      const services = await prisma.service.findMany({ where: { name: { in: lowCostServices } } });
      const lowCostServiceIds = services.map((service) => service.id);
      const lowCostBookingsCount = bookings.filter(
        (booking) => booking.serviceId && lowCostServiceIds.includes(booking.serviceId)
      ).length;

      return lowCostBookingsCount / bookings.length > 0.7;
    },
  },
  REFERRAL: {
    type: "auto",
    priority: 10,
    name: "REFERRAL",
    criteria: (customer) => Boolean(customer.referredBy),
  },
  INACTIVE: {
    type: "secondary",
    priority: 11,
    name: "INACTIVE",
    criteria: (customer) => {
      if (!customer.lastVisit) return false;

      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      return new Date(customer.lastVisit) < sixtyDaysAgo;
    },
  },
};

const parseCategoryHistory = (rawHistory: unknown): CategoryHistoryEntry[] => {
  if (!rawHistory) return [];

  try {
    const parsed = typeof rawHistory === "string" ? JSON.parse(rawHistory) : rawHistory;
    return Array.isArray(parsed) ? parsed as CategoryHistoryEntry[] : [];
  } catch {
    return [];
  }
};

export async function calculateCustomerCategories(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) return;

  let primaryCategory = customer.primaryCategory;
  let secondaryCategory = customer.secondaryCategory;
  const categoryHistory = parseCategoryHistory(customer.categoryHistory);

  if (customer.isCategoryLocked) {
    const isInactive = await (CATEGORY_RULES.INACTIVE.criteria ? CATEGORY_RULES.INACTIVE.criteria(customer) : false);
    secondaryCategory = isInactive ? "INACTIVE" : null;
  } else {
    let newPrimaryCategory = "NEW";
    let highestPriority = Infinity;
    const autoCategories = Object.values(CATEGORY_RULES).filter(
      (category) => category.type === "auto" || category.type === "manual"
    );
    const sortedCategories = autoCategories.sort((a, b) => a.priority - b.priority);

    for (const categoryDef of sortedCategories) {
      if (categoryDef.type === "manual") {
        if (customer.primaryCategory === categoryDef.name) {
          newPrimaryCategory = categoryDef.name;
          highestPriority = categoryDef.priority;
          break;
        }
        continue;
      }

      const isMatch = categoryDef.criteria ? await categoryDef.criteria(customer) : false;
      if (isMatch && categoryDef.priority < highestPriority) {
        newPrimaryCategory = categoryDef.name;
        highestPriority = categoryDef.priority;
      }
    }

    primaryCategory = newPrimaryCategory;

    const isInactive = await (CATEGORY_RULES.INACTIVE.criteria ? CATEGORY_RULES.INACTIVE.criteria(customer) : false);
    secondaryCategory = isInactive ? "INACTIVE" : null;
  }

  const lastHistoryEntry = categoryHistory[categoryHistory.length - 1];
  if (
    !lastHistoryEntry ||
    primaryCategory !== lastHistoryEntry.primaryCategory ||
    secondaryCategory !== lastHistoryEntry.secondaryCategory
  ) {
    categoryHistory.push({
      date: new Date().toISOString(),
      primaryCategory,
      secondaryCategory,
      changedBy: "System (Auto-assignment)",
    });
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      primaryCategory,
      secondaryCategory,
      categoryHistory: JSON.stringify(categoryHistory),
    },
  });
}

export async function initializeLoyaltyTiers() {
  const existingTiers = await prisma.loyaltyTier.count();
  if (existingTiers === 0) {
    await prisma.loyaltyTier.createMany({
      data: [
        { name: "Bronze", minVisits: 0, minSpend: 0, rank: 1, benefits: JSON.stringify({ description: "Base level." }) },
        { name: "Silver", minVisits: 3, minSpend: 1000, rank: 2, benefits: JSON.stringify({ description: "Small discounts." }) },
        { name: "Gold", minVisits: 8, minSpend: 5000, rank: 3, benefits: JSON.stringify({ description: "Exclusive benefits." }) },
      ],
    });
  }
}
