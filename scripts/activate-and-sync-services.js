const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_SERVICES = [
  // Express Wash
  { name: "Express Wash - Hatchback", price: 149, category: "Wash", description: "Exterior foam wash & tire rinse for compact cars." },
  { name: "Express Wash - Sedan", price: 149, category: "Wash", description: "Exterior foam wash & tire rinse for sedan cars." },
  { name: "Express Wash - SUV/MUV", price: 199, category: "Wash", description: "Exterior foam wash & tire rinse for SUVs & MUVs." },

  // Classic Wash
  { name: "Classic Wash - Hatchback", price: 199, category: "Wash", description: "Foam wash, interior vacuuming & tire dressing." },
  { name: "Classic Wash - Sedan", price: 199, category: "Wash", description: "Foam wash, interior vacuuming & tire dressing." },
  { name: "Classic Wash - SUV/MUV", price: 249, category: "Wash", description: "Foam wash, interior vacuuming & tire dressing." },

  // Premium Wash
  { name: "Premium Wash - Hatchback", price: 299, category: "Wash", description: "Deep foam wash, interior vacuuming, dashboard polish & tire shine." },
  { name: "Premium Wash - Sedan", price: 349, category: "Wash", description: "Deep foam wash, interior vacuuming, dashboard polish & tire shine." },
  { name: "Premium Wash - SUV/MUV", price: 399, category: "Wash", description: "Deep foam wash, interior vacuuming, dashboard polish & tire shine." },

  // Rainy Day Shine
  { name: "Rainy Day Shine - Hatchback", price: 399, category: "Wash", description: "Hydrophobic sealant wash layer protecting paint during rain." },
  { name: "Rainy Day Shine - Sedan", price: 449, category: "Wash", description: "Hydrophobic sealant wash layer protecting paint during rain." },
  { name: "Rainy Day Shine - SUV/MUV", price: 499, category: "Wash", description: "Hydrophobic sealant wash layer protecting paint during rain." },

  // Interior Deep Clean (Cabin Revive)
  { name: "Interior Deep Clean - Hatchback", price: 1299, category: "Detailing", description: "140°C steam cleaning, seat stain extraction & AC duct sanitization." },
  { name: "Interior Deep Clean - Sedan", price: 1299, category: "Detailing", description: "140°C steam cleaning, seat stain extraction & AC duct sanitization." },
  { name: "Interior Deep Clean - SUV/MUV", price: 1499, category: "Detailing", description: "140°C steam cleaning, seat stain extraction & AC duct sanitization." },

  // Dual-Action Paint Correction (Paint Restoration)
  { name: "Paint Correction - Hatchback", price: 1499, category: "Detailing", description: "Multi-stage machine compounding removing 85%+ swirl marks & oxidation." },
  { name: "Paint Correction - Sedan", price: 1499, category: "Detailing", description: "Multi-stage machine compounding removing 85%+ swirl marks & oxidation." },
  { name: "Paint Correction - SUV/MUV", price: 1799, category: "Detailing", description: "Multi-stage machine compounding removing 85%+ swirl marks & oxidation." },

  // 9H Nano Ceramic Coating
  { name: "Ceramic Coating - Hatchback", price: 5999, category: "Detailing", description: "9H Nano SiO2 glass coating shield with 3-year hydrophobic protection." },
  { name: "Ceramic Coating - Sedan", price: 7499, category: "Detailing", description: "9H Nano SiO2 glass coating shield with 3-year hydrophobic protection." },
  { name: "Ceramic Coating - SUV/MUV", price: 8999, category: "Detailing", description: "9H Nano SiO2 glass coating shield with 3-year hydrophobic protection." },

  // TPU Paint Protection Film (PPF)
  { name: "PPF Protection - Hatchback", price: 35000, category: "Detailing", description: "Self-healing ultra-clear TPU thermoplastic polyurethane film." },
  { name: "PPF Protection - Sedan", price: 40000, category: "Detailing", description: "Self-healing ultra-clear TPU thermoplastic polyurethane film." },
  { name: "PPF Protection - SUV/MUV", price: 45000, category: "Detailing", description: "Self-healing ultra-clear TPU thermoplastic polyurethane film." },

  // Addons
  { name: "Headlight UV Restoration", price: 499, category: "Addon", description: "Restores cloudy yellowed headlights to crystal clear clarity." },
  { name: "Engine Bay Detailing", price: 399, category: "Addon", description: "Safe steam degreasing and protective dressing for engine compartment." },
  { name: "Windshield Hydrophobic Coating", price: 799, category: "Addon", description: "Ultra-repellent rain glass coating for safer wet weather driving." },
];

async function main() {
  console.log("Syncing services in database...");

  for (const s of DEFAULT_SERVICES) {
    const existing = await prisma.service.findFirst({
      where: { name: { equals: s.name, mode: 'insensitive' } }
    });

    if (existing) {
      await prisma.service.update({
        where: { id: existing.id },
        data: {
          price: s.price,
          isActive: true,
          category: s.category,
          description: existing.description || s.description
        }
      });
      console.log(`Updated & Activated: ${s.name} -> ₹${s.price}`);
    } else {
      await prisma.service.create({
        data: {
          name: s.name,
          price: s.price,
          category: s.category,
          description: s.description,
          isActive: true
        }
      });
      console.log(`Created: ${s.name} -> ₹${s.price}`);
    }
  }

  // Ensure inactive old services are updated or activated
  const allServices = await prisma.service.findMany();
  console.log(`Total Services in DB: ${allServices.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
