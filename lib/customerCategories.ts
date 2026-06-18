import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define category rules and priority
export const CATEGORY_RULES: Record<string, { type: string, priority: number, name: string, criteria?: (customer: any) => boolean | Promise<boolean> }> = {
  STAFF: { type: 'manual', priority: 1, name: 'STAFF' },
  FAMILY: { type: 'manual', priority: 2, name: 'FAMILY' },
  FRIENDS: { type: 'manual', priority: 3, name: 'FRIENDS' },
  FLEET: { type: 'auto', priority: 4, name: 'FLEET', criteria: async (customer: any) => {
    const vehicleCount = await prisma.vehicle.count({ where: { customerId: customer.id } });
    return vehicleCount >= 3;
  }},
  VIP: { type: 'auto', priority: 5, name: 'VIP', criteria: (customer: any) => customer.totalVisits >= 8 || customer.totalSpent >= 5000 },
  PREMIUM: { type: 'auto', priority: 6, name: 'PREMIUM', criteria: async (customer: any) => {
    const vehicles = await prisma.vehicle.findMany({ where: { customerId: customer.id } });
    return vehicles.some(v => (v.value || 0) >= 15); // Vehicle value above ₹15 lakh (value is in lakhs)
  }},
  REGULAR: { type: 'auto', priority: 7, name: 'REGULAR', criteria: (customer: any) => customer.totalVisits >= 3 && customer.totalVisits <= 7 },
  NEW: { type: 'auto', priority: 8, name: 'NEW', criteria: (customer: any) => customer.totalVisits >= 0 && customer.totalVisits <= 2 },
  VALUE: { type: 'auto', priority: 9, name: 'VALUE', criteria: async (customer: any) => {
    const bookings = await prisma.booking.findMany({ where: { customerId: customer.id } }); // Only consider COMPLETED bookings for category
    if (bookings.length === 0) return false;
    const lowCostServices = ['Express Wash - Bike', 'Express Wash - Hatchback/Sedan', 'Express Wash - SUV/MUV', 'Classic Wash - Hatchback/Sedan', 'Classic Wash - SUV/MUV']; // Example low-cost services, need actual service IDs later

    // Fetch actual services to check for low-cost service IDs
    const services = await prisma.service.findMany({ where: { name: { in: lowCostServices } } });
    const lowCostServiceIds = services.map(s => s.id);

    const lowCostBookingsCount = bookings.filter(b => b.serviceId && lowCostServiceIds.includes(b.serviceId)).length;
    return (lowCostBookingsCount / bookings.length) > 0.7;
  }},
  REFERRAL: { type: 'auto', priority: 10, name: 'REFERRAL', criteria: (customer: any) => !!customer.referredBy }, // Assuming referredBy field signifies this
  INACTIVE: { type: 'secondary', priority: 11, name: 'INACTIVE', criteria: (customer: any) => {
    if (!customer.lastVisit) return false;
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    return new Date(customer.lastVisit) < sixtyDaysAgo;
  }},
};

export async function calculateCustomerCategories(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      vehicles: true,
      // When needed for calculations, include bookings
      // bookings: { where: { status: 'COMPLETED' } }, 
    },
  });

  if (!customer) return;

  let primaryCategory = customer.primaryCategory;
  let secondaryCategory = customer.secondaryCategory;
  let categoryHistory = JSON.parse(customer.categoryHistory?.toString() || '[]');

  // Preserve manual categories if locked
  if (customer.isCategoryLocked) {
    // Only apply secondary INACTIVE status if primary is locked
    const isInactive = await (CATEGORY_RULES.INACTIVE.criteria ? CATEGORY_RULES.INACTIVE.criteria(customer) : false);
    secondaryCategory = isInactive ? 'INACTIVE' : null;
  } else {
    // Auto-recalculate primary category
    let newPrimaryCategory = 'NEW'; // Default to NEW if no other category matches
    let highestPriority = Infinity;

    const autoCategories = Object.values(CATEGORY_RULES).filter(cat => cat.type === 'auto' || cat.type === 'manual');
    const sortedCategories = autoCategories.sort((a, b) => a.priority - b.priority);

    for (const categoryDef of sortedCategories) {
      if (categoryDef.type === 'manual') {
        // If the customer's current primary category is one of the manual ones, prioritize it
        if (customer.primaryCategory === categoryDef.name) {
          newPrimaryCategory = categoryDef.name;
          highestPriority = categoryDef.priority;
          break; // Manual categories override all auto-categories
        }
        continue; // Skip manual categories if customer doesn't have them set
      }
      
      // For auto categories, check criteria
      const isMatch = categoryDef.criteria ? await categoryDef.criteria(customer) : false;
      if (isMatch && categoryDef.priority < highestPriority) {
        newPrimaryCategory = categoryDef.name;
        highestPriority = categoryDef.priority;
      }
    }
    primaryCategory = newPrimaryCategory; // Update after checking all auto rules

    // Apply secondary INACTIVE status
    const isInactive = await (CATEGORY_RULES.INACTIVE.criteria ? CATEGORY_RULES.INACTIVE.criteria(customer) : false);
    secondaryCategory = isInactive ? 'INACTIVE' : null;
  }

  // Update category history if category changed
  const lastHistoryEntry = categoryHistory[categoryHistory.length - 1];
  if (!lastHistoryEntry || primaryCategory !== lastHistoryEntry.primaryCategory || secondaryCategory !== lastHistoryEntry.secondaryCategory) {
    categoryHistory.push({
      date: new Date().toISOString(),
      primaryCategory: primaryCategory,
      secondaryCategory: secondaryCategory,
      changedBy: 'System (Auto-assignment)',
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

// Initialize default settings for LoyaltyTiers (future expansion)
export async function initializeLoyaltyTiers() {
  const existingTiers = await prisma.loyaltyTier.count();
  if (existingTiers === 0) {
    await prisma.loyaltyTier.createMany({
      data: [
        { name: 'Bronze', minVisits: 0, minSpend: 0, rank: 1, benefits: JSON.stringify({ description: 'Base level.' }) },
        { name: 'Silver', minVisits: 3, minSpend: 1000, rank: 2, benefits: JSON.stringify({ description: 'Small discounts.' }) },
        { name: 'Gold', minVisits: 8, minSpend: 5000, rank: 3, benefits: JSON.stringify({ description: 'Exclusive benefits.' }) },
      ],
    });
  }
}
