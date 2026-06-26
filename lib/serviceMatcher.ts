import { prisma } from "./prisma";

export interface ServiceMatch {
  serviceOpted: string;
  vehicleType: string;
}

export interface DetectionRule {
  serviceOpted: string;
  vehicleType: string;
  minAmount: number;
  maxAmount: number;
}

export const defaultDetectionRules: DetectionRule[] = [
  { serviceOpted: "Bike Wash", vehicleType: "Bike", minAmount: 30, maxAmount: 50 },
  { serviceOpted: "Water Wash", vehicleType: "All", minAmount: 70, maxAmount: 100 },
  { serviceOpted: "Express Wash", vehicleType: "All", minAmount: 120, maxAmount: 150 },
  { serviceOpted: "Classic Wash", vehicleType: "Hatchback/Sedan", minAmount: 160, maxAmount: 200 },
  { serviceOpted: "Classic Wash", vehicleType: "SUV", minAmount: 220, maxAmount: 250 },
  { serviceOpted: "Premium Wash", vehicleType: "Hatchback", minAmount: 260, maxAmount: 300 },
  { serviceOpted: "Premium Wash", vehicleType: "Sedan", minAmount: 320, maxAmount: 350 },
  { serviceOpted: "Premium Wash", vehicleType: "SUV", minAmount: 360, maxAmount: 400 },
  { serviceOpted: "Premium + Wax", vehicleType: "Sedan", minAmount: 449, maxAmount: 450 },
  { serviceOpted: "Premium + Wax", vehicleType: "SUV", minAmount: 499, maxAmount: 500 },
  { serviceOpted: "Interior Dry Clean", vehicleType: "Hatchback/Sedan", minAmount: 799, maxAmount: 1000 },
  { serviceOpted: "Interior Dry Clean", vehicleType: "SUV", minAmount: 1001, maxAmount: 1200 },
  { serviceOpted: "Paint Correction", vehicleType: "Hatchback/Sedan", minAmount: 1499, maxAmount: 1499 },
  { serviceOpted: "Paint Correction", vehicleType: "SUV", minAmount: 1799, maxAmount: 1799 },
  { serviceOpted: "Dealer Monthly", vehicleType: "Bulk", minAmount: 2000, maxAmount: 999999 }
];

/**
 * Matches a transaction price with the corresponding service and vehicle type
 * based on Kleenkars pricing rules. Fetches custom rules from db settings if present.
 */
export async function matchServiceWithPrice(amount: number): Promise<ServiceMatch | null> {
  let rules = defaultDetectionRules;
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "auto_detection_rules" }
    });
    if (setting && setting.value) {
      const parsed = JSON.parse(setting.value);
      if (Array.isArray(parsed)) {
        rules = parsed;
      }
    }
  } catch (err) {
    console.error("Failed to load auto detection rules from settings:", err);
  }

  for (const rule of rules) {
    if (amount >= rule.minAmount && amount <= rule.maxAmount) {
      return { serviceOpted: rule.serviceOpted, vehicleType: rule.vehicleType };
    }
  }
  return null;
}
